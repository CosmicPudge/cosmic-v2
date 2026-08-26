import { requireCosmicAccount } from "@/services/auth/server";
import { isDatabaseConfigured } from "@/services/database/client";
import { deleteAccountAlarm, updateAccountAlarm } from "@/services/clock/alarmRepository";

export const dynamic = "force-dynamic";

function alarmInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const repeatWeekdays = value.repeatWeekdays;
  if (typeof value.label !== "string" || value.label.trim().length > 100 || typeof value.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) || typeof value.enabled !== "boolean" || !Array.isArray(repeatWeekdays) || !repeatWeekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) || new Set(repeatWeekdays).size !== repeatWeekdays.length || typeof value.snoozeEnabled !== "boolean") return null;
  return { label: value.label.trim() || "Alarm", time: value.time, enabled: value.enabled, repeatWeekdays: [...repeatWeekdays] as number[], snoozeEnabled: value.snoozeEnabled };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireCosmicAccount(request);
  if (!isDatabaseConfigured()) return Response.json({ error: "Alarm sync requires DATABASE_URL." }, { status: 503 });
  const input = alarmInput(await request.json().catch(() => null));
  if (!input) return Response.json({ error: "Invalid alarm." }, { status: 400 });
  const alarm = await updateAccountAlarm(account.id, (await context.params).id, input);
  return alarm ? Response.json({ alarm }) : Response.json({ error: "Alarm not found." }, { status: 404 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireCosmicAccount(request);
  if (!isDatabaseConfigured()) return Response.json({ error: "Alarm sync requires DATABASE_URL." }, { status: 503 });
  const deleted = await deleteAccountAlarm(account.id, (await context.params).id);
  return deleted ? Response.json({ deleted: true }) : Response.json({ error: "Alarm not found." }, { status: 404 });
}
