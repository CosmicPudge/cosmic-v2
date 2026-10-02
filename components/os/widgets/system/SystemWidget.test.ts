import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./SystemWidget.tsx", import.meta.url), "utf8");
const kioskSource = source.split('return <Widget accent="system">')[0];

test("kiosk System uses sponsor-facing status labels", () => {
  assert.match(source, /SYSTEM ONLINE/);
  assert.match(source, /Network/);
  assert.match(source, /Connected/);
  assert.match(source, /Display/);
  assert.match(source, /Active/);
  assert.match(source, /Mode/);
  assert.match(source, /Kiosk/);
});

test("kiosk System does not render internal profile diagnostics", () => {
  assert.doesNotMatch(kioskSource, /snapshot\.device\.deviceClass/);
  assert.doesNotMatch(kioskSource, /snapshot\.display\.profile/);
});
