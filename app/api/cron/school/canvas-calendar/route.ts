import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDatabase } from "@/services/database/client";
import { providerConnections } from "@/services/database/schema";
import { getProviderCredentials, updateProviderConnection, markProviderRefresh } from "@/services/providers/store";
import { syncCanvasCalendarForAccount } from "@/services/school/providers/canvas/calendarSync";
import { getSchoolAccess } from "@/services/school/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const connections = await getDatabase().select().from(providerConnections).where(eq(providerConnections.provider, "canvas")); const results: Array<{ status: string; eventsSeen?: number; created?: number; updated?: number; unmatched?: number }> = [];
  for (const connection of connections) {
    if (connection.providerAccountId !== "canvas-personal-calendar") continue;
    if (!getSchoolAccess({ id: connection.userId }).enabled) continue;
    const credentials = await getProviderCredentials<{ feedUrl?: unknown }>(connection.userId, connection.id); if (typeof credentials?.feedUrl !== "string") continue;
    try { const result = await syncCanvasCalendarForAccount(connection.userId, connection.id, credentials.feedUrl); await markProviderRefresh(connection.userId, connection.id); await updateProviderConnection(connection.userId, connection.id, { metadata: { lastCalendarSync: { ...result }, lastAttemptedAt: new Date().toISOString() }, status: "connected" }); results.push({ status: "ok", eventsSeen: result.eventsSeen, created: result.created, updated: result.updated, unmatched: result.unmatched }); }
    catch { await updateProviderConnection(connection.userId, connection.id, { metadata: { lastAttemptedAt: new Date().toISOString(), lastCalendarSyncError: "provider_unavailable" }, status: "provider_unavailable" }); results.push({ status: "provider_unavailable" }); }
  }
  return NextResponse.json({ processed: results.length, results });
}
