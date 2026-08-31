import "server-only";
import { CanvasCalendarProvider } from "@/components/school/data/providers/CanvasCalendarProvider";
import { getSchoolAccess } from "./access";
import { getProviderCredentials, listProviderConnections } from "@/services/providers/store";
import { buildSchoolSnapshot, type SchoolSnapshot } from "./domain";
import { emptySchoolSourceIntelligence } from "./domain";
import { listSchoolSources, type SchoolSourceRow } from "./sources/repository";
import { buildDashboard } from "@/components/school/data/engine/engine";
import type { SchoolDashboardData } from "@/components/school/data/types";
import type { SchoolSourceIntelligence } from "@/core/contracts/SchoolIntelligence";
import { detectSourceConflicts } from "./sources/conflicts";

const providerAccountId = "canvas-personal-calendar";

function sourceIntelligence(rows: SchoolSourceRow[]): SchoolSourceIntelligence {
  const combined = emptySchoolSourceIntelligence();
  for (const row of rows) {
    const item = row.intelligence as Partial<SchoolSourceIntelligence> | null;
    if (!item) continue;
    combined.facts.push(...(item.facts ?? []));
    combined.events.push(...(item.events ?? []));
    combined.actionItems.push(...(item.actionItems ?? []));
    combined.conflicts.push(...(item.conflicts ?? []));
    combined.warnings.push(...(item.warnings ?? []));
  }
  combined.conflicts.push(...detectSourceConflicts(combined.events));
  return combined;
}

function withSourceIntelligence(snapshot: SchoolSnapshot, rows: SchoolSourceRow[]): SchoolSnapshot {
  return { ...snapshot, sourceIntelligence: sourceIntelligence(rows) };
}

export interface SchoolServerData {
  data: SchoolDashboardData;
  snapshot: SchoolSnapshot;
  error?: string;
}

/** Server-side School boundary. Consumers receive normalized data only. */
export async function getSchoolDataForAccount(accountId: string): Promise<SchoolServerData> {
  if (!getSchoolAccess({ id: accountId }).enabled) {
    return { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "not_connected" }, sourceIntelligence: emptySchoolSourceIntelligence() } };
  }

  const sources = await listSchoolSources(accountId);

  const connection = (await listProviderConnections(accountId)).find((item) => item.provider === "canvas" && item.providerAccountId === providerAccountId);
  if (!connection) {
    return { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "not_connected" }, sourceIntelligence: sourceIntelligence(sources) } };
  }

  try {
    const credentials = await getProviderCredentials<{ feedUrl?: unknown }>(accountId, connection.id);
    const feedUrl = typeof credentials?.feedUrl === "string" ? credentials.feedUrl : undefined;
    const result = await new CanvasCalendarProvider(feedUrl).getDashboardDataWithDiagnostics();
    const snapshot = buildSchoolSnapshot(result.data);
    return { data: result.data, snapshot: withSourceIntelligence({ ...snapshot, sourceStatus: { canvas: "healthy", lastSyncedAt: connection.lastSuccessfulRefreshAt?.toISOString() ?? null } }, sources) };
  } catch {
    return { data: buildDashboard([]), snapshot: withSourceIntelligence({ courses: [], assignments: [], events: [], actionItems: [], facts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "error", lastSyncedAt: connection.lastSuccessfulRefreshAt?.toISOString() ?? null } }, sources), error: "Canvas data is temporarily unavailable." };
  }
}

export async function getSchoolSnapshotForAccount(accountId: string): Promise<SchoolSnapshot> {
  return (await getSchoolDataForAccount(accountId)).snapshot;
}
