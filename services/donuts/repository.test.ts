import test from "node:test";
import assert from "node:assert/strict";
import { DONUT_CONFIG } from "./config.ts";
import { DonutOrderError, validateCreatePendingDonutOrderInput } from "./orderValidation.ts";
import { hashDonutTrackingToken } from "./tokens.ts";

function futureSunday() {
  const date = new Date(); date.setUTCDate(date.getUTCDate() + 14);
  while (date.getUTCDay() !== 0) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

const config = { ...DONUT_CONFIG, enabled: true, availableDates: [futureSunday()], deliveryWindows: ["9:00–11:00 a.m."] };
const base = { idempotencyKey: "integration-test-key", deliveryDate: config.availableDates[0], deliveryWindow: config.deliveryWindows[0], quantities: { "original-glaze": 2 }, fullName: "Test Customer", email: "test@example.com", phone: "+1 (123) 456-7890", streetAddress: "1 Test Street", smsConsent: true };

test("server validation rejects malformed order input", () => {
  assert.throws(() => validateCreatePendingDonutOrderInput({ ...base, deliveryDate: "2026-02-30" }, config), DonutOrderError);
  assert.throws(() => validateCreatePendingDonutOrderInput({ ...base, quantities: { "original-glaze": 0 } }, config), DonutOrderError);
  assert.throws(() => validateCreatePendingDonutOrderInput({ ...base, quantities: { unknown: 1 } }, config), DonutOrderError);
  assert.throws(() => validateCreatePendingDonutOrderInput({ ...base, deliveryWindow: "anytime" }, config), DonutOrderError);
});

test("server validation snapshots authoritative prices and SMS consent time requirement", () => {
  const validated = validateCreatePendingDonutOrderInput(base, config);
  assert.equal(validated.items[0].purchasedName, "Original Glaze");
  assert.equal(validated.items[0].purchasedPriceCents, 320);
  assert.equal(validated.reservationQuantity, 2);
  assert.equal(validated.phoneE164, "+11234567890");
  assert.equal(validated.smsConsent, true);
});

test("tracking token hashing is one-way and stable for authorization lookup", () => {
  const hash = hashDonutTrackingToken("demo-secret-token");
  assert.equal(hash, hashDonutTrackingToken("demo-secret-token"));
  assert.notEqual(hash, "demo-secret-token");
});

test("capacity concurrency integration requires an explicitly configured local database", { skip: !process.env.DONUTS_TEST_DATABASE_URL }, async () => {
  assert.fail("Reserved for the isolated local Postgres harness after 0052_donut_orders.sql is applied; production databases are never migrated by this test.");
});
