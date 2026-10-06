import assert from "node:assert/strict";
import test from "node:test";
import { shouldLoadDashboardWidgetProvider } from "./widgetDataPolicy.ts";

test("kiosk scenes use the aggregate coordinator instead of dashboard providers", () => {
  assert.equal(shouldLoadDashboardWidgetProvider("kiosk"), false);
  assert.equal(shouldLoadDashboardWidgetProvider("dashboard"), true);
});
