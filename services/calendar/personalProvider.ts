import { CalendarEngine } from "@/engines/calendar";
import { AppleCalendarProvider } from "./appleCalendarProvider";
import { AppleCalendarWriter } from "./appleCalendarWriter";
import { getPersonalCalendarConnection } from "./personalStore";

let cached: { key: string; engine: CalendarEngine; writer: AppleCalendarWriter } | null = null;

export async function getPersonalCalendarContext() {
  const connection = await getPersonalCalendarConnection();
  if (!connection) return null;
  const key = JSON.stringify({ serverUrl: connection.serverUrl, username: connection.username, defaultCalendarName: connection.defaultCalendarName });
  if (cached?.key === key) return cached;
  const ownerKey = "personal:calendar";
  const provider = new AppleCalendarProvider({ ...connection, ownerKey });
  const writer = new AppleCalendarWriter({ ...connection, ownerKey });
  const engine = new CalendarEngine();
  engine.setProvider(provider);
  await engine.initialize();
  cached = { key, engine, writer };
  return cached;
}

export function invalidatePersonalCalendarContext() { cached = null; }
