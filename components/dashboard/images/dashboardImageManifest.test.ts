import assert from "node:assert/strict";
import test from "node:test";
import { DASHBOARD_IMAGE_MANIFEST, dashboardImage, currentClockImage } from "./dashboardImageManifest";

test("resolves every manifest image with a safe focal position", () => {
  const assets = Object.values(DASHBOARD_IMAGE_MANIFEST);
  assert.ok(assets.length >= 30);
  assert.equal(assets.filter((asset) => !asset.src).length, 0);
  assert.ok(assets.every((asset) => /^(left|center|right|\d+%) (top|center|bottom|\d+%)$/.test(asset.objectPosition)));
  assert.equal(dashboardImage("sports-f1").objectPosition, "58% center");
});

test("keeps daypart clock image selection on the shared manifest", () => {
  const image = currentClockImage();
  assert.match(image.id, /^clock-(morning|day|evening|night)$/);
  assert.ok(image.src);
});
