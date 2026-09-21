import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { proxy } from "../../proxy";
import { isPersonalSchoolUiRoute } from "../auth/proxyPolicy";

const originalNodeEnv = process.env.NODE_ENV;
const mutableEnv = process.env as Record<string, string | undefined>;

test.before(() => { mutableEnv.NODE_ENV = "production"; });
test.after(() => {
  if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = originalNodeEnv;
});

test("School page predicate is bounded to the page namespace", () => {
  for (const pathname of ["/school", "/school/", "/school/assignments", "/school/calendar", "/school/courses/example", "/school/settings"]) {
    assert.equal(isPersonalSchoolUiRoute(pathname), true, pathname);
  }
  for (const pathname of ["/schoolish", "/api/school", "/api/school/calendar", "/api/navigation", "/api/glasses/navigation", "/api/glasses/music", "/api/music/action", "/api/finance/accounts", "/api/other"]) {
    assert.equal(isPersonalSchoolUiRoute(pathname), false, pathname);
  }
});

test("anonymous production School pages pass through the proxy", async () => {
  for (const pathname of ["/school", "/school/assignments", "/school/calendar", "/school/settings"]) {
    const response = await proxy(new NextRequest(`https://cosmicpudge.shop${pathname}`));
    assert.equal(response.headers.get("x-middleware-next"), "1", pathname);
    assert.notEqual(response.status, 307, pathname);
  }
});

test("anonymous production sensitive APIs remain unauthorized by the proxy", async () => {
  const requests: Array<[string, string]> = [
    ["GET", "/api/navigation"],
    ["GET", "/api/glasses/navigation"],
    ["GET", "/api/glasses/music"],
    ["POST", "/api/music/action"],
    ["GET", "/api/school/calendar"],
    ["GET", "/api/school/sources"],
    ["GET", "/api/finance/accounts"],
  ];
  for (const [method, pathname] of requests) {
    const response = await proxy(new NextRequest(`https://cosmicpudge.shop${pathname}`, { method }));
    assert.equal(response.status, 401, `${method} ${pathname}`);
    assert.match(await response.text(), /Authentication required/);
  }
});
