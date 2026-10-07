import assert from "node:assert/strict";
import test from "node:test";
import { classifyWeatherError, diagnosticsEnvironment, type KioskDiagnostics } from "./diagnostics";

const env = process.env as Record<string, string | undefined>;

test("classifies safe weather provider categories", () => {
  assert.deepEqual(classifyWeatherError({ status: 401 }), { result: "unauthorized", httpStatus: 401 });
  assert.deepEqual(classifyWeatherError({ status: 429 }), { result: "rate-limited", httpStatus: 429 });
  assert.deepEqual(classifyWeatherError({ category: "timeout" }), { result: "timeout" });
  assert.deepEqual(classifyWeatherError({ category: "invalid-response" }), { result: "invalid-response" });
});

test("diagnostic response shape contains only safe fields", () => {
  const value: KioskDiagnostics = {
    weather: { apiKeyConfigured: true, browserLocationProvided: false, storedLocationAvailable: false, serverFallbackConfigured: true, locationSource: "server-fallback", providerAttempted: true, providerResult: "ok", aggregateHasWeather: true },
    school: { accountConfigured: true, accountLookupAttempted: true, accountMatched: true, provider: "canvas", providerConfigured: true, credentialAvailable: true, providerAttempted: true, providerResult: "ok", fallbackConfigured: false, aggregateConfigured: true, aggregateHasData: true },
  };
  const serialized = JSON.stringify(value);
  assert.equal(/OPENWEATHER|COSMIC_KIOSK_ACCOUNT_ID|latitude|longitude|accountId|access_token|refresh_token|cookie|assignmentContent|feedUrl/i.test(serialized), false);
});

test("production diagnostics are not allowed by environment gate", () => {
  const previous = { node: process.env.NODE_ENV, enabled: process.env.COSMIC_DEV_KIOSK_ENABLED };
  env.NODE_ENV = "production";
  env.COSMIC_DEV_KIOSK_ENABLED = "true";
  try { assert.equal(diagnosticsEnvironment(new Request("https://cosmicpudge.shop/api/kiosk/diagnostics")).allowedHost, false); }
  finally { if (previous.node === undefined) delete env.NODE_ENV; else env.NODE_ENV = previous.node; if (previous.enabled === undefined) delete env.COSMIC_DEV_KIOSK_ENABLED; else env.COSMIC_DEV_KIOSK_ENABLED = previous.enabled; }
});
