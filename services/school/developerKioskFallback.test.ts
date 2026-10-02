import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { resolveDeveloperKioskSchoolSources } from "./developerKioskSourceResolution";

type Result = { status: "connected" | "provider-error" | "unavailable"; value: string };
const usable = (result: Result) => result.status === "connected";

describe("developer kiosk School source order", () => {
  it("falls back when the account provider throws", async () => {
    const result = await resolveDeveloperKioskSchoolSources<Result>({ accountProvider: async () => { throw new Error("provider failure"); }, accountProviderUsable: usable, canvasIcalConfigured: true, canvasIcalProvider: async () => ({ status: "connected", value: "ical" }) });
    assert.equal(result.value?.value, "ical");
    assert.equal(result.source, "kiosk-canvas-ical");
    assert.equal(result.canvasIcalAttempted, true);
    assert.equal(result.canvasIcalSucceeded, true);
  });

  for (const status of ["provider-error", "unavailable"] as const) it(`falls back for account provider status ${status}`, async () => {
    const result = await resolveDeveloperKioskSchoolSources<Result>({ accountProvider: async () => ({ status, value: "account" }), accountProviderUsable: usable, canvasIcalConfigured: true, canvasIcalProvider: async () => ({ status: "connected", value: "ical" }) });
    assert.equal(result.value?.value, "ical");
    assert.equal(result.canvasIcalSucceeded, true);
  });

  it("does not attempt iCal after a usable account provider result", async () => {
    let attempted = false;
    const result = await resolveDeveloperKioskSchoolSources<Result>({ accountProvider: async () => ({ status: "connected", value: "account" }), accountProviderUsable: usable, canvasIcalConfigured: true, canvasIcalProvider: async () => { attempted = true; return { status: "connected", value: "ical" }; } });
    assert.equal(result.value?.value, "account");
    assert.equal(attempted, false);
    assert.equal(result.accountProviderSucceeded, true);
    assert.equal(result.canvasIcalAttempted, false);
  });

  it("returns unavailable after both sources fail", async () => {
    const result = await resolveDeveloperKioskSchoolSources<Result>({ accountProvider: async () => ({ status: "unavailable", value: "account" }), accountProviderUsable: usable, canvasIcalConfigured: true, canvasIcalProvider: async () => { throw new SyntaxError("bad feed"); } });
    assert.equal(result.value?.status, "unavailable");
    assert.equal(result.source, "kiosk-canvas-ical");
    assert.equal(result.canvasIcalAttempted, true);
    assert.equal(result.canvasIcalSucceeded, false);
  });
});
