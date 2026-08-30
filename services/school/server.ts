import "server-only";
import { CanvasCalendarProvider } from "@/components/school/data/providers/CanvasCalendarProvider";
import { getSchoolAccess } from "./access";
import { getProviderCredentials, listProviderConnections } from "@/services/providers/store";
import { buildSchoolSnapshot, type SchoolSnapshot } from "./domain";
import { buildDashboard } from "@/components/school/data/engine/engine";
import type { SchoolDashboardData } from "@/components/school/data/types";

const providerAccountId = "canvas-personal-calendar";

export interface SchoolServerData {
  data: SchoolDashboardData;
  snapshot: SchoolSnapshot;
  error?: string;
}

/** Server-side School boundary. Consumers receive normalized data only. */
export async function getSchoolDataForAccount(accountId: string): Promise<SchoolServerData> {
  if (!getSchoolAccess({ id: accountId }).enabled) {
    return { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "not_connected" } } };
  }

  const connection = (await listProviderConnections(accountId)).find((item) => item.provider === "canvas" && item.providerAccountId === providerAccountId);
  if (!connection) {
    return { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "not_connected" } } };
  }

  try {
    const credentials = await getProviderCredentials<{ feedUrl?: unknown }>(accountId, connection.id);
    const feedUrl = typeof credentials?.feedUrl === "string" ? credentials.feedUrl : undefined;
    const result = await new CanvasCalendarProvider(feedUrl).getDashboardDataWithDiagnostics();
    const snapshot = buildSchoolSnapshot(result.data);
    return { data: result.data, snapshot: { ...snapshot, sourceStatus: { canvas: "healthy", lastSyncedAt: connection.lastSuccessfulRefreshAt?.toISOString() ?? null } } };
  } catch {
    return { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "error", lastSyncedAt: connection.lastSuccessfulRefreshAt?.toISOString() ?? null } }, error: "Canvas data is temporarily unavailable." };
  }
}

export async function getSchoolSnapshotForAccount(accountId: string): Promise<SchoolSnapshot> {
  return (await getSchoolDataForAccount(accountId)).snapshot;
}
