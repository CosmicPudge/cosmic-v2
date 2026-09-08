import assert from "node:assert/strict";
import { test } from "node:test";
import { FinanceReadModelCoordinator } from "./readModel";

const response = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));

test("coalesces concurrent reads for one account and limit", async () => {
  const coordinator = new FinanceReadModelCoordinator();
  let calls = 0;
  const fetcher = () => { calls += 1; return response({ accounts: [], transactions: [] }); };
  const [first, second] = await Promise.all([coordinator.load("account-a", 200, fetcher), coordinator.load("account-a", 200, fetcher)]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});

test("isolates account keys and clears sign-out in-flight state", async () => {
  const coordinator = new FinanceReadModelCoordinator();
  let calls = 0;
  const fetcher = () => { calls += 1; return response({ accounts: [], transactions: [] }); };
  const pending = coordinator.load("account-a", 200, fetcher);
  coordinator.clearScope("account-a");
  coordinator.load("account-a", 200, fetcher);
  coordinator.load("account-b", 200, fetcher);
  await pending;
  assert.equal(calls, 3);
});

test("notifies active readers after a mutation or sync", () => {
  const coordinator = new FinanceReadModelCoordinator();
  let notifications = 0;
  const unsubscribe = coordinator.subscribe("account-a", 200, () => { notifications += 1; });
  coordinator.subscribe("account-b", 200, () => { notifications += 10; });
  coordinator.invalidate("account-a");
  assert.equal(notifications, 1);
  unsubscribe();
  coordinator.invalidate("account-a");
  assert.equal(notifications, 1);
});
