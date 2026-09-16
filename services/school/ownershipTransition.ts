import "server-only";

import type { DurableOwner } from "@/services/ownership/owner";
import type { DatabaseOwnerReference, DurableOwnerRepositoryAdapter } from "@/services/ownership/repository";
import { resolveSchoolOwner, validateSchoolOwnerConsistency } from "./ownership";

export type SchoolOwnershipState = "LEGACY_ONLY" | "DUAL_WRITE" | "OWNER_PREFERRED";
type SchoolEnvironment = Readonly<Record<string, string | undefined>>;

export type SchoolOwnerRow = {
  id: string;
  legacyAccountId: string;
  ownerId: string | null;
};

export type SchoolBackfillTable =
  | "school_sources"
  | "school_notes"
  | "school_assignments"
  | "school_study_sets"
  | "school_resources"
  | "school_course_plan_overrides"
  | "school_canvas_calendar_events";

export const SCHOOL_BACKFILL_TABLES: readonly SchoolBackfillTable[] = [
  "school_assignments",
  "school_canvas_calendar_events",
  "school_course_plan_overrides",
  "school_notes",
  "school_resources",
  "school_sources",
  "school_study_sets",
];

export type SchoolBackfillStore = {
  listRows(table: SchoolBackfillTable, cursor: string | null, limit: number): Promise<SchoolOwnerRow[]>;
  findOwnerById(ownerId: string): Promise<DatabaseOwnerReference | null>;
  ensureLegacyOwner(accountId: string): Promise<DatabaseOwnerReference | null>;
  setOwnerId(table: SchoolBackfillTable, rowId: string, ownerId: string): Promise<void>;
};

export type SchoolBackfillTableReport = {
  eligibleLegacyRows: number;
  alreadyCorrect: number;
  needingMapping: number;
  mappedDuringExecution: number;
  ownershipMismatch: number;
  unresolved: number;
  remainingNull: number;
};

export type SchoolBackfillReport = {
  tables: Record<SchoolBackfillTable, SchoolBackfillTableReport>;
  stopped: boolean;
  failureReason: "ownership_mismatch" | "unresolved_owner" | null;
};

function emptyTableReport(): SchoolBackfillTableReport {
  return { eligibleLegacyRows: 0, alreadyCorrect: 0, needingMapping: 0, mappedDuringExecution: 0, ownershipMismatch: 0, unresolved: 0, remainingNull: 0 };
}

export function getSchoolOwnershipState(env: SchoolEnvironment = process.env): SchoolOwnershipState {
  // This is a deployment assertion, not a schema probe. Operators must apply
  // and verify 0050 + 0051 before enabling either owner-aware state.
  const requested = env.COSMIC_SCHOOL_OWNERSHIP_STATE;
  if (requested !== "DUAL_WRITE" && requested !== "OWNER_PREFERRED") return "LEGACY_ONLY";
  return env.COSMIC_SCHOOL_OWNER_SCHEMA_READY === "true" ? requested : "LEGACY_ONLY";
}

export function assertSchoolOwnerWriteInput(input: { ownerId?: string | null }): void {
  if (input.ownerId !== undefined) throw new Error("client_owner_id_forbidden");
}

export async function prepareSchoolOwnerWrite<T>(
  input: T & { ownerId?: string | null },
  legacyAccountId: string,
  adapter?: DurableOwnerRepositoryAdapter,
  env: SchoolEnvironment = process.env,
): Promise<T & { ownerId?: string | null }> {
  // Returning to LEGACY_ONLY is the rollback mechanism: it stops owner-path
  // use without deleting registry mappings or already-populated owner IDs.
  assertSchoolOwnerWriteInput(input);
  if (getSchoolOwnershipState(env) === "LEGACY_ONLY") return input;
  const owner: DurableOwner = { kind: "legacy-account", accountId: legacyAccountId };
  const resolved = await resolveSchoolOwner(owner, adapter);
  if (!resolved || resolved.legacyAccountId !== legacyAccountId || resolved.kind !== "legacy-account") throw new Error("school_owner_unavailable");
  return { ...input, ownerId: resolved.databaseOwnerId };
}

export function validateSchoolOwnerRow(row: SchoolOwnerRow, owner: DatabaseOwnerReference | null): "valid" | "null" | "mismatch" | "unresolved" {
  if (!row.ownerId) return "null";
  if (!owner) return "unresolved";
  return owner.kind === "legacy-account" && owner.legacyAccountId === row.legacyAccountId ? "valid" : "mismatch";
}

export type SchoolReadDecision = "allow" | "allow-null" | "reject";

export function validateSchoolDualRead(
  fields: { userId?: string | null; accountId?: string | null; ownerId?: string | null },
  owner: DatabaseOwnerReference | null,
  state: SchoolOwnershipState,
): SchoolReadDecision {
  if (state === "LEGACY_ONLY") return "allow";
  if (!owner || !validateSchoolOwnerConsistency(owner, fields)) return "reject";
  return fields.ownerId ? "allow" : "allow-null";
}

export async function runSchoolOwnerBackfill(store: SchoolBackfillStore, options: { batchSize?: number } = {}): Promise<SchoolBackfillReport> {
  const batchSize = Number.isSafeInteger(options.batchSize) && (options.batchSize ?? 0) > 0 ? options.batchSize! : 100;
  const tables = Object.fromEntries(SCHOOL_BACKFILL_TABLES.map((table) => [table, emptyTableReport()])) as Record<SchoolBackfillTable, SchoolBackfillTableReport>;
  for (const table of SCHOOL_BACKFILL_TABLES) {
    let cursor: string | null = null;
    while (true) {
      const rows: SchoolOwnerRow[] = (await store.listRows(table, cursor, batchSize)).slice().sort((a, b) => a.id.localeCompare(b.id));
      if (!rows.length) break;
      for (const row of rows) {
        const report = tables[table];
        report.eligibleLegacyRows += 1;
        const existingOwner = row.ownerId ? await store.findOwnerById(row.ownerId) : null;
        const status = validateSchoolOwnerRow(row, existingOwner);
        if (status === "mismatch") {
          report.ownershipMismatch += 1;
          return { tables, stopped: true, failureReason: "ownership_mismatch" };
        }
        if (status === "unresolved") {
          report.unresolved += 1;
          report.remainingNull += 1;
          return { tables, stopped: true, failureReason: "unresolved_owner" };
        }
        if (status === "valid") {
          report.alreadyCorrect += 1;
          continue;
        }
        report.needingMapping += 1;
        const owner = await store.ensureLegacyOwner(row.legacyAccountId);
        if (!owner || owner.kind !== "legacy-account" || owner.legacyAccountId !== row.legacyAccountId) {
          report.unresolved += 1;
          report.remainingNull += 1;
          return { tables, stopped: true, failureReason: "unresolved_owner" };
        }
        await store.setOwnerId(table, row.id, owner.databaseOwnerId);
        report.mappedDuringExecution += 1;
      }
      const next: string | null = rows.at(-1)?.id ?? null;
      if (!next || rows.length < batchSize) break;
      cursor = next;
    }
  }
  return { tables, stopped: false, failureReason: null };
}
