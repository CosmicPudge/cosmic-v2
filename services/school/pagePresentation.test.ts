import assert from "node:assert/strict";
import test from "node:test";

import { requireSchoolPagePresentation, shouldLoadAccountBackedSchoolData } from "./pagePresentation";

const mutableEnv = process.env as Record<string, string | undefined>;

test("production anonymous School page uses personal-local presentation without account lookup", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  mutableEnv.NODE_ENV = "production";
  let accountLookup = false;
  try {
    const presentation = await requireSchoolPagePresentation(
      new Request("https://cosmicpudge.shop/school"),
      false,
      async () => {
        accountLookup = true;
        throw new Error("account lookup should not run");
      },
    );
    assert.equal(presentation, "personal-local");
    assert.equal(accountLookup, false);
  } finally {
    if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = originalNodeEnv;
  }
});

test("presented account session preserves existing account access behavior", async () => {
  const presentation = await requireSchoolPagePresentation(
    new Request("https://cosmicpudge.shop/school"),
    true,
    async () => ({
      principal: { kind: "account", accountId: "owner" },
      request: { principal: { kind: "account", accountId: "owner" }, policy: "private-account", mode: "account", origin: "public-host" },
      storageOwner: { kind: "legacy-account", accountId: "owner" },
    }),
  );
  assert.equal(presentation, "account");
});

test("presented session still fails closed when the existing access gate denies it", async () => {
  await assert.rejects(
    requireSchoolPagePresentation(
      new Request("https://cosmicpudge.shop/school"),
      true,
      async () => { throw new Response("School is not available.", { status: 403 }); },
    ),
    (error: unknown) => error instanceof Response && error.status === 403,
  );
});

test("expired session cookie returns to the personal-local presentation", async () => {
  const presentation = await requireSchoolPagePresentation(
    new Request("https://cosmicpudge.shop/school", { headers: { cookie: "cosmic_session=expired" } }),
    true,
    async () => { throw new Response("Authentication required.", { status: 401 }); },
  );
  assert.equal(presentation, "personal-local");
});

test("personal School scopes do not request account-backed snapshots", () => {
  for (const scopeKind of ["personal", "local", "device", "dev"]) {
    assert.equal(shouldLoadAccountBackedSchoolData(scopeKind), false, scopeKind);
  }
  assert.equal(shouldLoadAccountBackedSchoolData("account"), true);
});
