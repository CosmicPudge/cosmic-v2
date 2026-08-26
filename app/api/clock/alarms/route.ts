import { kioskBootId, requireAuthenticatedSession, requireCosmicAccount } from "@/services/auth/server";
import { isDatabaseConfigured } from "@/services/database/client";
import { createAccountAlarm, listAccountAlarms } from "@/services/clock/alarmRepository";

export const dynamic = "force-dynamic";

function alarmInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const repeatWeekdays = value.repeatWeekdays;
  if (typeof value.id !== "string" || !value.id || typeof value.label !== "string" || value.label.trim().length > 100 || typeof value.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) || typeof value.enabled !== "boolean" || !Array.isArray(repeatWeekdays) || !repeatWeekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) || new Set(repeatWeekdays).size !== repeatWeekdays.length || typeof value.snoozeEnabled !== "boolean") return null;
  return { id: value.id, label: value.label.trim() || "Alarm", time: value.time, enabled: value.enabled, repeatWeekdays: [...repeatWeekdays] as number[], snoozeEnabled: value.snoozeEnabled };
}

export async function GET(request: Request) {
  const session = await requireAuthenticatedSession(request, { allowDevice: true, bootId: kioskBootId(request) });
  if (!isDatabaseConfigured()) return Response.json({ alarms: [] });
  return Response.json({ alarms: await listAccountAlarms(session.account.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const account = await requireCosmicAccount(request);
  if (!isDatabaseConfigured()) return Response.json({ error: "Alarm sync requires DATABASE_URL." }, { status: 503 });
  const input = alarmInput(await request.json().catch(() => null));
  if (!input) return Response.json({ error: "Invalid alarm." }, { status: 400 });
  try { const alarm = await createAccountAlarm(account.id, input); return Response.json({ alarm }, { status: 201 }); } catch { return Response.json({ error: "Alarm could not be saved." }, { status: 409 }); }
}
