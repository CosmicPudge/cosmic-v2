import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectPersonalMigration, isSensitiveStorageKey, migratePersonalStorage, type StorageLike } from "./personalMigration";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  entries() { return [...this.values.entries()]; }
}

const key = (scope: string, domain: string) => `cosmic.scope.${scope}.${domain}`;
const legacy = (domain: string) => ({ settings: "cosmic.settings.local-data", finance: "cosmic.finance.local-data", notes: "cosmic.notes.local-data" }[domain] ?? `cosmic.${domain}.local-data`);

test("empty storage is inspectable without mutation", () => {
  const storage = new MemoryStorage();
  const before = storage.entries();
  const report = inspectPersonalMigration(storage);
  assert.equal(report.domains.every((domain) => domain.status === "absent"), true);
  assert.deepEqual(storage.entries(), before);
});

test("legacy data is copied forward and retained", () => {
  const storage = new MemoryStorage(); storage.setItem(legacy("notes"), JSON.stringify({ version: 1, notes: [{ id: "n1" }] }));
  const result = migratePersonalStorage(storage);
  assert.equal(storage.getItem(key("personal", "notes")), storage.getItem(legacy("notes")));
  assert.equal(storage.getItem(legacy("notes")) !== null, true); assert.equal(result.conflicts.length, 0);
});

test("one local scope is the only safe creator source", () => {
  const storage = new MemoryStorage(); storage.setItem(key("local", "projects"), JSON.stringify({ version: 1, projects: [{ id: "p1" }] }));
  migratePersonalStorage(storage); assert.equal(storage.getItem(key("personal", "projects"))?.includes("p1"), true);
});

test("existing personal data is never overwritten", () => {
  const storage = new MemoryStorage(); storage.setItem(key("personal", "settings"), JSON.stringify({ version: 1, value: "personal" })); storage.setItem(key("local", "settings"), JSON.stringify({ version: 1, value: "local" }));
  const result = migratePersonalStorage(storage); assert.deepEqual(JSON.parse(storage.getItem(key("personal", "settings"))!), { version: 1, value: "personal" }); assert.deepEqual(result.conflicts, ["settings"]);
});

test("multiple account scopes are reported and never selected", () => {
  const storage = new MemoryStorage(); storage.setItem(key("account-a", "finance"), "{\"version\":1}"); storage.setItem(key("account-b", "finance"), "{\"version\":1}");
  const inspection = inspectPersonalMigration(storage); const finance = inspection.domains.find((domain) => domain.domain === "finance")!;
  assert.equal(finance.status, "ambiguous"); assert.equal(finance.candidates.length, 2); assert.equal(finance.candidates.every((candidate) => candidate.scope === "account"), true);
  const result = migratePersonalStorage(storage); assert.deepEqual(result.conflicts, ["finance"]); assert.equal(storage.getItem(key("personal", "finance")), null);
});

test("canonical local predecessor wins over account candidates", () => {
  const storage = new MemoryStorage();
  storage.setItem(key("local", "settings"), JSON.stringify({ version: 1, preferences: {} }));
  storage.setItem(key("account-a", "settings"), JSON.stringify({ version: 1, preferences: { profileId: "a" } }));
  storage.setItem(key("account-b", "settings"), JSON.stringify({ version: 1, preferences: { profileId: "b" } }));
  const inspection = inspectPersonalMigration(storage); const settings = inspection.domains.find((domain) => domain.domain === "settings")!;
  assert.equal(settings.status, "ready"); assert.equal(settings.safeSource, "local"); assert.equal(settings.ambiguityReason, null);
  assert.deepEqual(settings.candidates.map((candidate) => candidate.key), [key("local", "settings"), key("account-a", "settings"), key("account-b", "settings")]);
});

test("account-only source is reported but never selected", () => {
  const storage = new MemoryStorage(); storage.setItem(key("account-a", "school"), JSON.stringify({ version: 1, courses: [] }));
  const report = inspectPersonalMigration(storage); const school = report.domains.find((domain) => domain.domain === "school")!;
  assert.equal(school.status, "account-source-only"); assert.equal(school.safeSource, null); assert.equal(migratePersonalStorage(storage).conflicts.includes("school"), true);
  assert.equal(storage.getItem(key("personal", "school")), null);
});

test("malformed and unknown-schema sources are preserved as conflicts", () => {
  const storage = new MemoryStorage(); storage.setItem(key("local", "garage"), "not-json");
  const result = migratePersonalStorage(storage); assert.deepEqual(result.conflicts, ["garage"]); assert.equal(storage.getItem(key("local", "garage")), "not-json");
});

test("old schema versions are not copied automatically", () => {
  const storage = new MemoryStorage(); storage.setItem(key("local", "settings"), JSON.stringify({ version: 0, preferences: {} }));
  const result = migratePersonalStorage(storage); assert.deepEqual(result.conflicts, ["settings"]); assert.equal(storage.getItem(key("personal", "settings")), null);
});

test("AFROTC legacy string preference is a supported historical format", () => {
  const storage = new MemoryStorage(); storage.setItem("cosmic.afrotc.cadet-category", "First Term Cadet");
  const inspection = inspectPersonalMigration(storage); const afrotc = inspection.domains.find((domain) => domain.domain === "afrotc-cadet-category")!;
  assert.equal(afrotc.status, "ready"); assert.equal(afrotc.safeSource, "legacy"); assert.equal(afrotc.safeSourceVersion, "unknown");
  migratePersonalStorage(storage); assert.equal(storage.getItem(key("personal", "afrotc-cadet-category")), "First Term Cadet");
});

test("malformed AFROTC legacy preference remains invalid", () => {
  const storage = new MemoryStorage(); storage.setItem("cosmic.afrotc.cadet-category", "Unknown category");
  const report = inspectPersonalMigration(storage); const afrotc = report.domains.find((domain) => domain.domain === "afrotc-cadet-category")!;
  assert.equal(afrotc.status, "invalid-source"); assert.equal(storage.getItem("cosmic.afrotc.cadet-category"), "Unknown category");
});

test("inspection uses ready rather than copied for non-mutating source discovery", () => {
  const storage = new MemoryStorage(); storage.setItem(key("local", "search"), JSON.stringify({ version: 1, searches: ["weather"] }));
  const report = inspectPersonalMigration(storage); const search = report.domains.find((domain) => domain.domain === "search")!;
  assert.equal(search.status, "ready"); assert.equal(storage.getItem(key("personal", "search")), null);
});

test("repeated inspection has no side effects and source keys remain retained", () => {
  const storage = new MemoryStorage(); storage.setItem(key("local", "finance"), JSON.stringify({ version: 1, accounts: [{ id: "a1" }] }));
  const before = storage.entries(); const first = inspectPersonalMigration(storage); const second = inspectPersonalMigration(storage);
  assert.deepEqual(first, second); assert.deepEqual(storage.entries(), before); assert.equal(storage.getItem(key("local", "finance")) !== null, true);
});

test("current and old schema data remain source-preserving", () => {
  const storage = new MemoryStorage(); storage.setItem(key("local", "school"), JSON.stringify({ version: 1, terms: [], courses: [] }));
  const result = migratePersonalStorage(storage); assert.equal(result.completedDomains.includes("school"), true); assert.equal(storage.getItem(key("local", "school")) !== null, true);
});

test("repeated and partially completed migrations are idempotent", () => {
  const storage = new MemoryStorage(); storage.setItem(key("local", "notes"), JSON.stringify({ version: 1, notes: [{ id: "n1" }] }));
  const first = migratePersonalStorage(storage); const personal = storage.getItem(key("personal", "notes")); const second = migratePersonalStorage(storage);
  assert.equal(first.completedDomains.includes("notes"), true); assert.equal(second.conflicts.includes("notes"), false); assert.equal(storage.getItem(key("personal", "notes")), personal);
});

test("Finance, School, Notes, Projects, Garage, Settings, and Sports fixtures preserve IDs and values", () => {
  const storage = new MemoryStorage();
  const fixtures: Array<[string, unknown]> = [
    ["finance", { version: 1, accounts: [{ id: "a1" }], transactions: [{ id: "t1", amountMinor: 1234 }] }],
    ["school", { version: 1, courses: [{ id: "c1" }], assignments: [{ id: "as1" }] }],
    ["notes", { version: 1, notes: [{ id: "n1", body: "keep" }] }],
    ["projects", { version: 1, projects: [{ id: "p1" }] }],
    ["garage", { version: 1, vehicles: [{ id: "v1" }] }],
    ["settings", { version: 1, preferences: { sports: { followedTeams: [{ teamId: "team-1" }] } } }],
  ];
  for (const [domain, value] of fixtures) storage.setItem(key("local", domain), JSON.stringify(value));
  migratePersonalStorage(storage);
  for (const [domain, value] of fixtures) assert.deepEqual(JSON.parse(storage.getItem(key("personal", domain))!), value);
});

test("sensitive auth, provider, device, kiosk, cache, and ephemeral keys are excluded", () => {
  for (const value of ["cosmic.password", "cosmic.oauth.refresh-token", "cosmic.plaid.credential", "cosmic.device.id", "cosmic.sync.personal.notes", "cosmic.active-scope", "cosmic.kiosk.crash"]) assert.equal(isSensitiveStorageKey(value), true);
  assert.equal(isSensitiveStorageKey(key("local", "notes")), false);
});
