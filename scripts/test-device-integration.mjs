import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.test", override: true, quiet: true });
const url = new URL(process.env.DATABASE_URL ?? "");
const isLocal = process.env.NODE_ENV === "test" && ["127.0.0.1", "localhost", "::1"].includes(url.hostname) && url.pathname.slice(1) === "cosmic_test" && decodeURIComponent(url.username) === "cosmic_test";
if (!isLocal) throw new Error("Refusing integration tests: expected NODE_ENV=test and local cosmic_test as cosmic_test.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const run = randomUUID().replaceAll("-", "");
const deviceId = `test_device_${run}`;
const publicNumber = `TEST-COSMIC-${run.slice(0, 12)}`;
const bootId = `test-boot-${run.slice(0, 16)}`;
const oldCredential = `old-${randomBytes(32).toString("base64url")}`;
const newCredential = `new-${randomBytes(32).toString("base64url")}`;
const ownerId = `user_${run}_owner`;
const wrongOwnerId = `user_${run}_wrong`;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const server = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3101"], { env: { ...process.env, NODE_ENV: "test", COSMIC_TEST_MODE: "1", DATABASE_URL: process.env.DATABASE_URL, COSMIC_ENROLLMENT_SECRET: process.env.COSMIC_ENROLLMENT_SECRET, NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3101" }, stdio: ["ignore", "inherit", "inherit"] });
const base = "http://127.0.0.1:3101";
async function waitForServer() { for (let attempt = 0; attempt < 60; attempt += 1) { try { if ((await fetch(`${base}/api/account/session`)).status) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 500)); } throw new Error("Test Next server did not start."); }
async function request(path, options = {}) { return fetch(`${base}${path}`, { ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers ?? {}) }, cache: "no-store" }); }
async function json(response) { return response.json(); }
async function seedAccount(id, label) { const email = `${label}-${run}@example.test`; await sql("insert into users (id,email,normalized_email,password_hash,password_salt) values ($1,$2,$2,$3,$4)", [id, email, randomBytes(64).toString("hex"), randomBytes(16).toString("hex")]); const token = randomBytes(32).toString("base64url"); await sql("insert into sessions (id,user_id,session_token_hash,expires_at,session_type) values ($1,$2,$3,now()+interval '1 hour','user')", [`session_${randomUUID()}`, id, sha(token)]); return { id, cookie: `cosmic_session=${encodeURIComponent(token)}` }; }
async function sql(text, values = []) { return pool.query(text, values); }
let owner;
let wrongOwner;
try {
  await waitForServer();
  const identity = await sql("select current_database() as database, current_user as user_name, inet_server_addr()::text as server_address");
  assert.equal(identity.rows[0].database, "cosmic_test");
  assert.equal(identity.rows[0].user_name, "cosmic_test");
  assert.ok(["127.0.0.1", "127.0.0.1/32", "::1", "::1/128"].includes(identity.rows[0].server_address));
  console.log("test-db database=cosmic_test user=cosmic_test host=127.0.0.1");
  owner = await seedAccount(ownerId, "owner");
  wrongOwner = await seedAccount(wrongOwnerId, "wrong-owner");
  await sql("insert into devices (id,user_id,public_number,credential_hash,ownership_status,name,type) values ($1,$2,$3,$4,'owned','Synthetic Display','display')", [deviceId, owner.id, publicNumber, sha(oldCredential)]);

  const handoff = await request("/api/devices/handoff", { method: "POST", headers: { Authorization: `Bearer ${oldCredential}` }, body: JSON.stringify({ bootId }) });
  const handoffBody = await json(handoff); console.log(`handoff-response status=${handoff.status} keys=${Object.keys(handoffBody).join(",")}`); assert.equal(handoff.status, 200, `handoff status=${handoff.status} authenticated=${String(handoffBody.authenticated)} deviceIdPresent=${String(Boolean(handoffBody.deviceId))}`); assert.equal(handoffBody.authenticated, true); assert.equal("credential" in handoffBody, false); assert.equal(handoffBody.deviceId, deviceId);
  const storedHandoff = await sql("select token_hash,device_id,boot_id from device_session_handoffs where device_id=$1", [deviceId]); assert.equal(storedHandoff.rows.length, 1); assert.notEqual(storedHandoff.rows[0].token_hash, handoffBody.handoffToken);
  const consumed = await request("/api/devices/handoff/consume", { method: "POST", body: JSON.stringify({ bootId, handoffToken: handoffBody.handoffToken }) }); assert.equal(consumed.status, 200); const consumedBody = await json(consumed); assert.equal(consumedBody.deviceId, deviceId); assert.equal("credential" in consumedBody, false);
  const replay = await request("/api/devices/handoff/consume", { method: "POST", body: JSON.stringify({ bootId, handoffToken: handoffBody.handoffToken }) }); assert.equal(replay.status, 401);
  const wrongBootHandoff = await request("/api/devices/handoff", { method: "POST", headers: { Authorization: `Bearer ${oldCredential}` }, body: JSON.stringify({ bootId }) }); assert.equal(wrongBootHandoff.status, 200); const wrongBootBody = await json(wrongBootHandoff);
  const wrongBoot = await request("/api/devices/handoff/consume", { method: "POST", body: JSON.stringify({ bootId: `${bootId}-wrong`, handoffToken: wrongBootBody.handoffToken }) }); assert.equal(wrongBoot.status, 401);
  await sql("update device_session_handoffs set expires_at=now()-interval '1 minute' where device_id=$1", [deviceId]);
  const expired = await request("/api/devices/handoff", { method: "POST", headers: { Authorization: `Bearer ${oldCredential}` }, body: JSON.stringify({ bootId }) }); assert.equal(expired.status, 200); const expiredBody = await json(expired); await sql("update device_session_handoffs set expires_at=now()-interval '1 minute' where device_id=$1 and token_hash=$2", [deviceId, sha(expiredBody.handoffToken)]); assert.equal((await request("/api/devices/handoff/consume", { method: "POST", body: JSON.stringify({ bootId, handoffToken: expiredBody.handoffToken }) })).status, 401);
  await sql("update devices set revoked_at=now() where id=$1", [deviceId]); assert.equal((await request("/api/devices/handoff", { method: "POST", headers: { Authorization: `Bearer ${oldCredential}` }, body: JSON.stringify({ bootId }) })).status, 401); await sql("update devices set revoked_at=null where id=$1", [deviceId]);

  const challenge = randomBytes(32).toString("base64url");
  const challengeResponse = await request("/api/devices/enrollment/challenge", { method: "POST", body: JSON.stringify({ deviceId, publicNumber, challenge }) }); assert.equal(challengeResponse.status, 200); const challengeBody = await json(challengeResponse);
  assert.equal((await request("/api/devices/enrollment/authorize", { method: "POST", headers: { Cookie: wrongOwner.cookie, Origin: `${base}` }, body: JSON.stringify({ challengeId: challengeBody.challengeId }) })).status, 409);
  const authorized = await request("/api/devices/enrollment/authorize", { method: "POST", headers: { Cookie: owner.cookie, Origin: `${base}` }, body: JSON.stringify({ challengeId: challengeBody.challengeId }) }); assert.equal(authorized.status, 200);
  const grantResponse = await request("/api/devices/enrollment/grant", { method: "POST", body: JSON.stringify({ challengeId: challengeBody.challengeId, challenge }) }); assert.equal(grantResponse.status, 200); const grantBody = await json(grantResponse); assert.equal(grantBody.approved, true);
  const staged = await request("/api/devices/enrollment/stage", { method: "POST", body: JSON.stringify({ challengeId: challengeBody.challengeId, challenge, grant: grantBody.grant, credentialHash: sha(newCredential) }) }); assert.equal(staged.status, 200);
  const dbBefore = await sql("select count(*)::int as count from devices");
  const finalized = await request("/api/devices/enrollment/redeem", { method: "POST", body: JSON.stringify({ challengeId: challengeBody.challengeId, challenge, grant: grantBody.grant, credential: newCredential }) }); assert.equal(finalized.status, 200); const finalizedBody = await json(finalized); assert.equal(finalizedBody.enrolled, true); assert.equal("credential" in finalizedBody, false);
  const retry = await request("/api/devices/enrollment/redeem", { method: "POST", body: JSON.stringify({ challengeId: challengeBody.challengeId, challenge, grant: grantBody.grant, credential: newCredential }) }); assert.equal(retry.status, 200); assert.equal((await sql("select count(*)::int as count from devices")).rows[0].count, dbBefore.rows[0].count);
  assert.equal((await request("/api/devices/bootstrap", { method: "POST", headers: { Authorization: `Bearer ${oldCredential}` }, body: JSON.stringify({ bootId }) })).status, 401);
  assert.equal((await request("/api/devices/bootstrap", { method: "POST", headers: { Authorization: `Bearer ${newCredential}` }, body: JSON.stringify({ bootId }) })).status, 200);
  const device = await sql("select d.id,d.public_number,d.credential_hash,e.staged_credential_hash from devices d left join device_enrollment_grants e on e.device_id=d.id where d.id=$1", [deviceId]); assert.equal(device.rows[0].id, deviceId); assert.equal(device.rows[0].public_number, publicNumber); assert.equal(device.rows[0].credential_hash, sha(newCredential)); assert.notEqual(device.rows[0].credential_hash, newCredential); assert.notEqual(device.rows[0].staged_credential_hash, newCredential);

  const released = await request("/api/account/devices", { method: "DELETE", headers: { Cookie: owner.cookie, Origin: base }, body: JSON.stringify({ deviceId }) }); assert.equal(released.status, 200);
  const releasedDevice = await sql("select id,public_number,user_id,ownership_status,credential_hash,credential_revoked_at from devices where id=$1", [deviceId]); assert.equal(releasedDevice.rows[0].id, deviceId); assert.equal(releasedDevice.rows[0].public_number, publicNumber); assert.equal(releasedDevice.rows[0].user_id, null); assert.equal(releasedDevice.rows[0].ownership_status, "unclaimed"); assert.equal(releasedDevice.rows[0].credential_hash, null); assert.ok(releasedDevice.rows[0].credential_revoked_at);
  const grantsBeforeLifecycle = await sql("select count(*)::int as count from device_enrollment_grants where device_id=$1", [deviceId]); const lifecycle = await request("/api/devices/lifecycle", { method: "POST", body: JSON.stringify({ deviceId, publicNumber }) }); assert.equal(lifecycle.status, 200); assert.deepEqual(await json(lifecycle), { state: "needs_provisioning", pairingRequired: true, deviceId, publicNumber }); const lifecycleAgain = await request("/api/devices/lifecycle", { method: "POST", body: JSON.stringify({ deviceId, publicNumber }) }); assert.equal(lifecycleAgain.status, 200); assert.equal((await sql("select count(*)::int as count from device_enrollment_grants where device_id=$1", [deviceId])).rows[0].count, grantsBeforeLifecycle.rows[0].count);
  const revokedHandoff = await request("/api/devices/handoff", { method: "POST", headers: { Authorization: `Bearer ${newCredential}` }, body: JSON.stringify({ bootId, deviceId, publicNumber }) }); const revokedBody = await json(revokedHandoff); assert.equal(revokedHandoff.status, 409); assert.equal(revokedBody.state, "needs_provisioning"); assert.equal("handoffToken" in revokedBody, false); assert.equal("credential" in revokedBody, false);
  const revokedAgain = await request("/api/devices/handoff", { method: "POST", headers: { Authorization: `Bearer ${newCredential}` }, body: JSON.stringify({ bootId, deviceId, publicNumber }) }); assert.equal(revokedAgain.status, 409); assert.equal((await json(revokedAgain)).state, "needs_provisioning");

  const pairCount = await sql("select count(*)::int as count from devices");
  const reusedPair = await request("/api/devices/pair", { method: "POST", headers: { Cookie: `cosmic_device_id=${deviceId}` }, body: JSON.stringify({ bootId }) }); assert.equal(reusedPair.status, 200); const reusedPairBody = await json(reusedPair); assert.equal(reusedPairBody.deviceNumber, publicNumber);
  const reusedApproval = await request("/api/devices/pair/approve", { method: "POST", headers: { Cookie: owner.cookie, Origin: base }, body: JSON.stringify({ userCode: reusedPairBody.userCode }) }); assert.equal(reusedApproval.status, 200); assert.equal((await json(reusedApproval)).deviceId, deviceId);
  const stalePair = await request("/api/devices/pair", { method: "POST", headers: { Cookie: "cosmic_device_id=test_deleted_identity" }, body: JSON.stringify({ bootId }) }); assert.equal(stalePair.status, 409);
  const missingPair = await request("/api/devices/pair", { method: "POST", body: JSON.stringify({ bootId }) }); assert.equal(missingPair.status, 409);
  assert.equal((await sql("select count(*)::int as count from devices")).rows[0].count, pairCount.rows[0].count);
  console.log("integration-tests passed=handoff,enrollment,rotation,replay,revocation,pairing-invariants");
} finally {
  if (owner) await sql("delete from users where id = $1", [owner.id]).catch(() => {});
  if (wrongOwner) await sql("delete from users where id = $1", [wrongOwner.id]).catch(() => {});
  await sql("delete from devices where id=$1", [deviceId]).catch(() => {});
  await pool.end();
  server.kill("SIGTERM");
}
