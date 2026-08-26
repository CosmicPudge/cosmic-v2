import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireCosmicAccount } from "@/services/auth/server";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { phoneLocations } from "@/services/database/schema";
import { isValidKioskTimezone, reverseGeocode } from "@/services/devices/kioskProfile";

function validCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function responseLocation(row: typeof phoneLocations.$inferSelect | undefined) {
  if (!row) return null;
  return {
    latitude: row.latitude,
    longitude: row.longitude,
    ...(row.accuracy !== null ? { accuracy: row.accuracy } : {}),
    ...(row.label ? { label: row.label } : {}),
    ...(row.city ? { city: row.city } : {}),
    ...(row.region ? { region: row.region } : {}),
    ...(row.country ? { country: row.country } : {}),
    ...(row.timezone ? { timezone: row.timezone } : {}),
    reportedAt: row.reportedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    if (!isDatabaseConfigured()) return NextResponse.json({ location: null }, { headers: { "Cache-Control": "no-store" } });
    const [row] = await getDatabase().select().from(phoneLocations).where(eq(phoneLocations.userId, account.id)).limit(1);
    return NextResponse.json({ location: responseLocation(row) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Phone location is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    if (!isDatabaseConfigured()) return NextResponse.json({ error: "Phone location storage is unavailable." }, { status: 503 });
    const body = await request.json().catch(() => null) as { latitude?: unknown; longitude?: unknown; accuracy?: unknown; timezone?: unknown } | null;
    if (!body || !validCoordinate(body.latitude, -90, 90) || !validCoordinate(body.longitude, -180, 180)) return NextResponse.json({ error: "Valid phone coordinates are required." }, { status: 400 });
    const database = getDatabase();
    const [previous] = await database.select().from(phoneLocations).where(eq(phoneLocations.userId, account.id)).limit(1);
    const unchanged = previous && Math.abs(previous.latitude - body.latitude) < 0.0001 && Math.abs(previous.longitude - body.longitude) < 0.0001;
    const resolved = unchanged ? null : await reverseGeocode(body.latitude, body.longitude);
    const timezone = typeof body.timezone === "string" && isValidKioskTimezone(body.timezone) ? body.timezone : previous?.timezone ?? null;
    const now = new Date();
    const values = {
      userId: account.id,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: validCoordinate(body.accuracy, 0, 1_000_000) ? body.accuracy : previous?.accuracy ?? null,
      label: resolved?.label ?? previous?.label ?? null,
      city: resolved?.label?.split(",")[0] ?? previous?.city ?? null,
      region: resolved?.region ?? previous?.region ?? null,
      country: resolved?.country ?? previous?.country ?? null,
      timezone,
      reportedAt: now,
      updatedAt: now,
    };
    const [row] = await database.insert(phoneLocations).values(values).onConflictDoUpdate({ target: phoneLocations.userId, set: values }).returning();
    return NextResponse.json({ location: responseLocation(row) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Phone location could not be saved." }, { status: 503 });
  }
}
