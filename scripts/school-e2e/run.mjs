import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { neon } from "@neondatabase/serverless";
import { syntheticDocx, syntheticPng } from "./fixture.mjs";

const env = process.env;
const baseUrl = env.SCHOOL_E2E_BASE_URL?.replace(/\/$/, "");
const required = ["SCHOOL_E2E_USER_ID", "SCHOOL_E2E_EMAIL", "SCHOOL_E2E_PASSWORD"];
const timeoutMs = Number(env.SCHOOL_E2E_HTTP_TIMEOUT_MS ?? 15_000);
const failFast = env.SCHOOL_E2E_FAIL_FAST === "true";
const groups = new Set((env.SCHOOL_E2E_GROUPS ?? "all").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
const runId = `E2E-${Date.now()}-${randomUUID().slice(0, 8)}`;
const results = [];
const cleanup = [];
const cookies = new Map();
const secondCookies = new Map();
const database = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;

function selected(group) { return groups.has("all") || groups.has(group); }
function result(status, label, detail = "") { results.push({ status, label, detail }); console.log(`${status} ${label}${detail ? ` — ${detail}` : ""}`); if (status === "FAIL" && failFast) throw new Error(detail || label); }
function assert(condition, label, detail) { if (!condition) { result("FAIL", label, detail); return false; } result("PASS", label); return true; }
function skip(label, detail) { result("SKIP", label, detail); }
async function request(path, options = {}) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(options.headers); if (cookies.size) headers.set("Cookie", [...cookies].map(([key, value]) => `${key}=${value}`).join("; "));
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers, signal: controller.signal });
    for (const value of response.headers.getSetCookie?.() ?? []) { const pair = value.split(";", 1)[0]; const at = pair.indexOf("="); if (at > 0) cookies.set(pair.slice(0, at), pair.slice(at + 1)); }
    let body = null; try { body = await response.json(); } catch { /* non-JSON response */ }
    return { response, body };
  } finally { clearTimeout(timer); }
}
async function requestWithJar(path, options = {}, jar) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(options.headers); if (jar.size) headers.set("Cookie", [...jar].map(([key, value]) => `${key}=${value}`).join("; "));
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers, signal: controller.signal });
    for (const value of response.headers.getSetCookie?.() ?? []) { const pair = value.split(";", 1)[0]; const at = pair.indexOf("="); if (at > 0) jar.set(pair.slice(0, at), pair.slice(at + 1)); }
    let body = null; try { body = await response.json(); } catch { /* non-JSON response */ }
    return { response, body };
  } finally { clearTimeout(timer); }
}
async function json(path, method, body) { return request(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
async function jsonWithJar(path, method, body, jar) { return requestWithJar(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, jar); }
async function runInternal(accountId, query) {
  return new Promise((resolve, reject) => {
    const child = spawn("node_modules/.bin/tsx", ["scripts/school-e2e/assert-consumers.ts", accountId, query], { env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = ""; let stderr = ""; child.stdout.on("data", (chunk) => { stdout += chunk; }); child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject); child.on("close", (code) => { if (code !== 0) reject(new Error(stderr.trim() || `internal consumer exit ${code}`)); else { try { resolve(JSON.parse(stdout.trim().split("\n").at(-1))); } catch { reject(new Error("internal consumer returned invalid diagnostics")); } } });
  });
}
async function findAssets(sourceId, userId) { if (!database) return []; return database`select id, source_id, user_id, mime_type, storage_provider from school_assets where source_id = ${sourceId} and user_id = ${userId}`; }
async function findFindings(sourceId, userId) { if (!database) return []; return database`select id, type, payload, review_state from school_findings where source_id = ${sourceId} and user_id = ${userId}`; }
async function runGroup(name, callback) { if (!selected(name)) { skip(`${name}.group`, "not selected"); return; } try { await callback(); } catch (error) { result("FAIL", `${name}.group`, error instanceof Error ? error.message : "unexpected harness error"); } }

if (!baseUrl || required.some((name) => !env[name])) { console.error(`Harness configuration requires SCHOOL_E2E_BASE_URL and ${required.join(", ")}.`); process.exit(2); }
if (env.SCHOOL_E2E_DRY_RUN === "true") { console.log(`DRY RUN target=${baseUrl} account=${env.SCHOOL_E2E_USER_ID} runId=${runId} groups=${[...groups].join(",")} cleanup=${env.SCHOOL_E2E_KEEP_DATA === "true" ? "retained" : "registered"}`); process.exit(0); }
const target = new URL(baseUrl); const local = ["localhost", "127.0.0.1", "::1"].includes(target.hostname);
if (!local && env.SCHOOL_E2E_ALLOW_PRODUCTION !== "true") { console.error("Refusing non-local target without SCHOOL_E2E_ALLOW_PRODUCTION=true."); process.exit(2); }
if (!local && env.SCHOOL_E2E_CONFIRM_TARGET !== target.hostname) { console.error("SCHOOL_E2E_CONFIRM_TARGET must exactly match the target hostname."); process.exit(2); }

try {
  await runGroup("auth", async () => {
    const login = await json("/api/account/signin", "POST", { email: env.SCHOOL_E2E_EMAIL, password: env.SCHOOL_E2E_PASSWORD });
    if (!assert(login.response.ok, "auth.login", `HTTP ${login.response.status}`)) return;
    assert(cookies.size > 0, "auth.session-cookie", "sign-in did not establish a session cookie");
    const session = await request("/api/account/session"); assert(session.body?.authenticated === true && session.body?.account?.id === env.SCHOOL_E2E_USER_ID, "auth.session", "session account did not match synthetic account");
    const school = await request("/api/school/calendar"); assert(school.response.ok, "auth.school-access", `HTTP ${school.response.status}`);
  });
  await runGroup("assignments", async () => {
    const title = `${runId} E2E Homework`; const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const created = await json("/api/school/assignments", "POST", { title, dueAt, sourceType: "manual", priority: "high", estimatedMinutes: 45, personalNotes: "Synthetic Cosmic School E2E data" });
    if (!assert(created.response.status === 201, "assignment.create", `HTTP ${created.response.status}`)) return; const id = created.body?.assignment?.id; if (!id) return result("FAIL", "assignment.id", "missing assignment ID"); cleanup.push(async () => { await request(`/api/school/assignments/${encodeURIComponent(id)}`, { method: "DELETE" }); });
    const read = await request(`/api/school/assignments/${encodeURIComponent(id)}`); assert(read.response.ok && read.body?.assignment?.title === title, "assignment.read");
    const updated = await json(`/api/school/assignments/${encodeURIComponent(id)}`, "PATCH", { title: `${title} Updated`, priority: "critical", planningStatus: "done", personalNotes: "Updated synthetic data" }); assert(updated.response.ok, "assignment.update");
    const reopened = await json(`/api/school/assignments/${encodeURIComponent(id)}`, "PATCH", { planningStatus: "not_started" }); assert(reopened.response.ok && reopened.body?.assignment?.planningStatus === "not_started", "assignment.reopen");
    const list = await request("/api/school/assignments"); assert(list.response.ok && list.body?.assignments?.some((item) => item.id === id), "assignment.list-persistence");
  });
  await runGroup("notes", async () => {
    const title = `${runId} E2E Lecture Notes`; const created = await json("/api/school/notes", "POST", { title, content: "Synthetic lecture content.", topics: [runId, "unit testing"], classDate: new Date().toISOString() });
    if (!assert(created.response.status === 201, "note.create", `HTTP ${created.response.status}`)) return; const id = created.body?.note?.id; if (!id) return result("FAIL", "note.id", "missing note ID"); cleanup.push(async () => { await request(`/api/school/notes/${encodeURIComponent(id)}`, { method: "DELETE" }); });
    const read = await request(`/api/school/notes/${encodeURIComponent(id)}`); assert(read.response.ok && read.body?.note?.title === title, "note.read");
    const update = await json(`/api/school/notes/${encodeURIComponent(id)}`, "PATCH", { title: `${title} Updated`, content: "Updated synthetic lecture content.", topics: [runId, "updated"] }); assert(update.response.ok, "note.update");
    const list = await request("/api/school/notes"); assert(list.response.ok && list.body?.notes?.some((item) => item.id === id), "note.list-persistence");
  });
  await runGroup("uploads", async () => {
    const text = `${runId} TEST MATH 1010\nHomework 5 is due Friday at 11:59 PM.\nBring a calculator to class Wednesday.\nQuiz Friday on unit-circle values.`;
    const source = await json("/api/school/sources", "POST", { title: `${runId} Text Source`, text, category: "Course" });
    if (!assert(source.response.status === 201, "source.text-create", `HTTP ${source.response.status}`)) return; const sourceId = source.body?.source?.id; if (!sourceId) return result("FAIL", "source.id", "missing source ID"); cleanup.push(async () => { await request(`/api/school/sources/${encodeURIComponent(sourceId)}`, { method: "DELETE" }); });
    const read = await request(`/api/school/sources/${encodeURIComponent(sourceId)}`); assert(read.response.ok && read.body?.source?.id === sourceId, "source.text-persistence");
    const override = await json(`/api/school/sources/${encodeURIComponent(sourceId)}`, "PATCH", { courseId: null }); assert(override.response.ok, "source.course-override-clear");
    const form = new FormData(); form.set("file", new Blob([Buffer.from("synthetic multipart text")], { type: "text/plain" }), `${runId}.txt`); form.set("category", "Course"); const upload = await request("/api/school/sources/upload", { method: "POST", body: form }); assert([200, 201].includes(upload.response.status), "source.multipart-txt"); if (upload.body?.source?.id) cleanup.push(async () => { await request(`/api/school/sources/${encodeURIComponent(upload.body.source.id)}`, { method: "DELETE" }); });
    const docxForm = new FormData(); docxForm.set("file", new Blob([syntheticDocx()], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), `${runId}.docx`); docxForm.set("category", "Course"); const docx = await request("/api/school/sources/upload", { method: "POST", body: docxForm }); assert([200, 201].includes(docx.response.status), "source.multipart-docx", `HTTP ${docx.response.status}`); if (docx.body?.source?.id) cleanup.push(async () => { await request(`/api/school/sources/${encodeURIComponent(docx.body.source.id)}`, { method: "DELETE" }); });
    const imageForm = new FormData(); imageForm.set("file", new Blob([syntheticPng], { type: "image/png" }), `${runId}.png`); imageForm.set("category", "Course"); const image = await request("/api/school/sources/upload", { method: "POST", body: imageForm }); const imageId = image.body?.source?.id; assert([200, 201].includes(image.response.status), "source.multipart-png-retained", `HTTP ${image.response.status}`); if (!imageId) return result("FAIL", "source.image-id", "missing image source ID"); cleanup.push(async () => { await request(`/api/school/sources/${encodeURIComponent(imageId)}`, { method: "DELETE" }); });
    const assets = await findAssets(imageId, env.SCHOOL_E2E_USER_ID); assert(assets.length === 1 && assets[0].user_id === env.SCHOOL_E2E_USER_ID, "source.image-asset-retained"); const assetId = assets[0]?.id;
    if (assetId) { const asset = await request(`/api/school/assets/${encodeURIComponent(assetId)}`); assert(asset.response.ok && asset.response.headers.get("content-type")?.startsWith("image/png"), "source.image-asset-retrievable"); }
    const retry = await request(`/api/school/sources/${encodeURIComponent(imageId)}/reprocess`, { method: "POST" }); assert([200, 201, 422].includes(retry.response.status) && retry.body?.error !== "The retained image asset is unavailable.", "source.image-retry-path", `HTTP ${retry.response.status}`);
    const findings = await findFindings(imageId, env.SCHOOL_E2E_USER_ID); assert(findings.every((finding) => finding.user_id === env.SCHOOL_E2E_USER_ID && finding.source_id === imageId), "source.findings-account-scoped");
  });
  await runGroup("consumers", async () => { if (!database) return skip("consumers", "DATABASE_URL is required for normalized internal assertions"); const data = await runInternal(env.SCHOOL_E2E_USER_ID, runId); assert(data.calendar >= 0, "consumer.calendar-adapter"); assert(data.week === true, "consumer.week-normalized"); assert(data.briefing === true, "consumer.daily-briefing"); assert(data.search === true, "consumer.search-adapter"); assert(data.ai === true, "consumer.ai-context"); assert(data.coursePlan === true, "consumer.course-plan"); });
  await runGroup("security", async () => {
    const unauth = await fetch(`${baseUrl}/api/school/sources`); assert([401, 403].includes(unauth.status), "security.unauthenticated-school");
    const secondId = env.SCHOOL_E2E_SECOND_USER_ID; const secondEmail = env.SCHOOL_E2E_SECOND_EMAIL; const secondPassword = env.SCHOOL_E2E_SECOND_PASSWORD;
    if (!secondId || !secondEmail || !secondPassword) return skip("security.cross-account", "set SCHOOL_E2E_SECOND_USER_ID/EMAIL/PASSWORD for the independent session");
    const login = await jsonWithJar("/api/account/signin", "POST", { email: secondEmail, password: secondPassword }, secondCookies); if (!assert(login.response.ok, "security.second-login", `HTTP ${login.response.status}`)) return;
    const deniedSchool = await requestWithJar("/api/school/sources", {}, secondCookies); assert([401, 403].includes(deniedSchool.response.status), "security.second-school-denied", `HTTP ${deniedSchool.response.status}`);
    const primarySource = (await request("/api/school/sources")).body?.sources?.find((item) => String(item.title).includes(runId)); const sourceId = primarySource?.id;
    if (sourceId) { const attack = await jsonWithJar(`/api/school/sources/${encodeURIComponent(sourceId)}`, "PATCH", { courseId: "math-1060" }, secondCookies); assert([401, 403, 404].includes(attack.response.status), "security.cross-account-source-mutation", `HTTP ${attack.response.status}`); }
    const primaryAssignment = (await request("/api/school/assignments")).body?.assignments?.find((item) => String(item.title).includes(runId));
    if (primaryAssignment?.id) { const attack = await jsonWithJar(`/api/school/assignments/${encodeURIComponent(primaryAssignment.id)}`, "PATCH", { title: `${runId} unauthorized` }, secondCookies); assert([401, 403, 404].includes(attack.response.status), "security.cross-account-assignment-mutation", `HTTP ${attack.response.status}`); }
    const primaryNote = (await request("/api/school/notes")).body?.notes?.find((item) => String(item.title).includes(runId));
    if (primaryNote?.id) { const attack = await jsonWithJar(`/api/school/notes/${encodeURIComponent(primaryNote.id)}`, "PATCH", { title: `${runId} unauthorized` }, secondCookies); assert([401, 403, 404].includes(attack.response.status), "security.cross-account-note-mutation", `HTTP ${attack.response.status}`); }
  });
} finally {
  if (env.SCHOOL_E2E_KEEP_DATA !== "true") for (const action of cleanup.reverse()) { try { await action(); } catch { result("FAIL", "cleanup", "synthetic resource cleanup failed"); } }
  else console.log(`KEEP_DATA=true runId=${runId}`);
}
const counts = Object.fromEntries(["PASS", "FAIL", "SKIP", "PROVIDER_UNAVAILABLE"].map((status) => [status, results.filter((item) => item.status === status).length]));
console.log(`SUMMARY ${JSON.stringify(counts)}`);
if (counts.FAIL > 0) process.exitCode = 1;
