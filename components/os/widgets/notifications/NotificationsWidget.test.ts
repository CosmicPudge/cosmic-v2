import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./NotificationsWidget.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../../../app/globals.css", import.meta.url), "utf8");

test("Notifications keeps an intentional All clear empty state", () => {
  assert.match(source, /All clear\./);
  assert.match(source, /kiosk-notifications-empty/);
  assert.match(styles, /data-notification-state="clear"/);
  assert.match(styles, /\.kiosk-notifications-empty h1[\s\S]*font-size: clamp\(2\.6rem/);
});
