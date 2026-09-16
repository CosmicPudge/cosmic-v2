import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PERSONAL_PRINCIPAL, resolvePrivateRequestContext } from "@/services/auth/privateContext";
import { PERSONAL_OWNER, resolveDurableOwner } from "@/services/ownership/owner";
import { OUTLOOK_MAIL_SCOPES } from "@/services/mail/outlook";
import { personalCalendarAccessContext } from "./access";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const mutableEnv = process.env as Record<string, string | undefined>;
const proxySource = readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
const eventsSource = readFileSync(new URL("../../app/api/calendar/events/route.ts", import.meta.url), "utf8");
const connectionSource = readFileSync(new URL("../../app/api/calendar/personal-connection/route.ts", import.meta.url), "utf8");

test("PersonalPrincipal resolves a Personal Calendar context", () => {
  mutableEnv.NODE_ENV = "development";
  const context = personalCalendarAccessContext(new Request("http://localhost:3000/api/calendar"));
  assert.deepEqual(context?.principal, PERSONAL_PRINCIPAL);
  assert.deepEqual(context?.storageOwner, PERSONAL_OWNER);
});

test("legacy account ownership remains distinct from personal ownership", () => {
  assert.deepEqual(resolveDurableOwner({ kind: "account", accountId: "acct-1" }), { kind: "legacy-account", accountId: "acct-1" });
  assert.notDeepEqual(resolveDurableOwner({ kind: "account", accountId: "acct-1" }), PERSONAL_OWNER);
});

test("device principals cannot become Calendar owners", () => {
  assert.equal(resolveDurableOwner({ kind: "device", deviceId: "device-1" }), null);
  assert.equal(personalCalendarAccessContext(new Request("https://cosmicpudge.shop/api/calendar")), null);
});

test("client ownership-shaped inputs cannot select personal Calendar", () => {
  const context = personalCalendarAccessContext(new Request("http://localhost:3000/api/calendar?accountId=attacker&userId=attacker&ownerId=attacker&email=attacker%40example.test&providerSubject=attacker"));
  assert.deepEqual(context?.storageOwner, PERSONAL_OWNER);
  assert.equal(JSON.stringify(context?.storageOwner).includes("attacker"), false);
});

test("personal Calendar does not use account provider connections or credentials", () => {
  const accessSource = source("./access.ts");
  const providerSource = source("./personalProvider.ts");
  assert.equal(accessSource.includes("listProviderConnections"), false);
  assert.equal(providerSource.includes("getAccountCalendarContext"), false);
});

test("Gmail and Outlook mail consent remain free of Calendar permission", () => {
  const gmailSource = source("../mail/gmail.ts");
  assert.equal(gmailSource.includes("calendar"), false);
  assert.equal(OUTLOOK_MAIL_SCOPES.some((scope) => scope.toLowerCase().includes("calendar")), false);
});

test("Calendar capability is explicit and not inferred from mail capability", () => {
  const capabilitySource = source("../providers/capabilities.ts");
  assert.match(capabilitySource, /calendar\.read/);
  assert.match(capabilitySource, /calendar\.write/);
  assert.match(capabilitySource, /mail\.read/);
  assert.match(capabilitySource, /declaredProviderCapabilities/);
});

test("personal connection metadata is personal-only and uses encrypted storage", () => {
  assert.match(connectionSource, /personalCalendarAccessContext/);
  assert.match(connectionSource, /createLocalProviderCredentialStore|personalStore/);
  assert.equal(connectionSource.includes("listProviderConnections"), false);
  assert.equal(connectionSource.includes("getCurrentCosmicAccount"), false);
});

test("personal CalDAV credentials require HTTPS and never use client paths", () => {
  const storeSource = source("./personalStore.ts");
  assert.match(storeSource, /https:/);
  assert.equal(storeSource.includes("localStorage"), false);
  assert.equal(storeSource.includes("process\.cwd\(\)"), false);
});

test("personal Calendar writes retain same-origin protection", () => {
  assert.match(eventsSource, /assertSameOrigin/);
  assert.match(connectionSource, /assertSameOrigin/);
});

test("production personal Calendar remains behind the existing fail-closed boundary", () => {
  mutableEnv.NODE_ENV = "production";
  assert.equal(resolvePrivateRequestContext(new Request("https://cosmicpudge.shop/api/calendar"), "private-personal"), null);
  assert.match(proxySource, /isPersonalCalendarDevelopmentRequest/);
  assert.match(proxySource, /NODE_ENV === "development"/);
});

test("personal Calendar cache identity is owner-specific", () => {
  const providerSource = source("./personalProvider.ts");
  assert.match(providerSource, /personal:calendar/);
  const appleSource = source("./appleCalendarProvider.ts");
  assert.match(appleSource, /ownerKey/);
});

test("School, Glasses, and AI remain outside this Calendar adapter", () => {
  const providerSource = source("./personalProvider.ts");
  assert.equal(/school|glasses|@\/services\/ai/i.test(providerSource), false);
});

test("personal Calendar context contains no account-shaped principal", () => {
  mutableEnv.NODE_ENV = "development";
  const context = personalCalendarAccessContext(new Request("http://localhost:3000/api/calendar"));
  assert.equal("accountId" in (context?.principal ?? {}), false);
  assert.equal("accountId" in (context?.storageOwner ?? {}), false);
});

test("the personal Calendar owner is not generated at runtime", () => {
  assert.equal(PERSONAL_OWNER.id, "personal");
  assert.equal(Object.isFrozen(PERSONAL_OWNER), true);
});

test("public personal Calendar requests remain unavailable", () => {
  mutableEnv.NODE_ENV = "production";
  assert.equal(personalCalendarAccessContext(new Request("https://cosmicpudge.shop/api/calendar")), null);
});

test("the personal Calendar store uses a fixed provider namespace", () => {
  const storeSource = source("./personalStore.ts");
  assert.match(storeSource, /PERSONAL_CALENDAR_PROVIDER = "calendar"/);
  assert.match(storeSource, /PERSONAL_OWNER/);
});

test("personal Calendar provider is isolated from account Calendar provider construction", () => {
  const providerSource = source("./personalProvider.ts");
  assert.match(providerSource, /AppleCalendarProvider/);
  assert.equal(providerSource.includes("listProviderConnections"), false);
  assert.equal(providerSource.includes("providerConnections"), false);
});

test("personal connection input cannot carry an ownership selector", () => {
  assert.equal(connectionSource.includes("ownerId"), false);
  assert.equal(connectionSource.includes("accountId"), false);
  assert.equal(connectionSource.includes("providerSubject"), false);
});

test("personal Calendar route does not fall back to an account session", () => {
  const routeSource = source("../../app/api/calendar/route.ts");
  assert.match(routeSource, /personalCalendarAccessContext/);
  assert.match(routeSource, /getPersonalCalendarContext/);
  assert.equal(routeSource.includes("getCurrentCosmicAccount"), false);
});

test("personal Calendar provider credentials are never exposed to Glasses", () => {
  const glassesSource = readFileSync(new URL("../../app/api/glasses/calendar/route.ts", import.meta.url), "utf8");
  assert.equal(glassesSource.includes("getPersonalCalendarConnection"), false);
  assert.equal(glassesSource.includes("password"), false);
});
