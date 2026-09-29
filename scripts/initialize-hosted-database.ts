import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const migrationFolder = "./drizzle";
const migrationFolderPath = resolve(process.cwd(), migrationFolder);
const journalPath = resolve(migrationFolderPath, "meta/_journal.json");

export const schoolTables = [
  "school_sources",
  "school_notes",
  "school_findings",
  "school_assets",
  "school_audio_transcripts",
  "school_assignments",
  "school_study_sets",
  "school_flashcards",
  "school_resources",
  "school_email_proposals",
  "school_course_plan_overrides",
  "school_canvas_calendar_events",
] as const;

type DatabaseSnapshot = {
  databaseName: string;
  schemaName: string;
  publicTableCount: number;
  migrationJournalExists: boolean;
  usersExists: boolean;
  sessionsExists: boolean;
  accountIdentitiesExists: boolean;
  cosmicOwnersExists: boolean;
  schoolSourcesExists: boolean;
  schoolAssignmentsExists: boolean;
  schoolTables: Record<string, boolean>;
  postgresVersion?: string;
};

export type MigrationInventory = {
  sqlCount: number;
  journalCount: number;
  missing: string[];
  extra: string[];
  duplicates: string[];
};

export type OwnershipFlags = {
  schemaReady: string | undefined;
  state: string | undefined;
};

type GuardResult = { ok: true } | { ok: false; reasons: string[] };

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(text: string): Promise<{ rows: T[] }>;
};

function bool(value: unknown): boolean {
  return value === true || value === "t";
}

function numberValue(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function tablePresenceRow(snapshot: DatabaseSnapshot): Record<string, boolean> {
  return {
    users: snapshot.usersExists,
    sessions: snapshot.sessionsExists,
    account_identities: snapshot.accountIdentitiesExists,
    cosmic_owners: snapshot.cosmicOwnersExists,
    ...snapshot.schoolTables,
    school_sources: snapshot.schoolSourcesExists,
    school_assignments: snapshot.schoolAssignmentsExists,
  };
}

export function evaluatePrecheck(snapshot: DatabaseSnapshot, inventory: MigrationInventory, flags: OwnershipFlags): GuardResult {
  const reasons: string[] = [];
  if (snapshot.databaseName !== "postgres") reasons.push(`current database is ${snapshot.databaseName}, expected postgres`);
  if (snapshot.schemaName !== "public") reasons.push(`current schema is ${snapshot.schemaName}, expected public`);
  if (snapshot.publicTableCount !== 0) reasons.push(`public application table count is ${snapshot.publicTableCount}, expected 0`);
  if (snapshot.migrationJournalExists) reasons.push("Drizzle migration journal already exists");

  for (const [name, exists] of Object.entries(tablePresenceRow(snapshot))) {
    if (exists) reasons.push(`fresh-target table already exists: ${name}`);
  }

  if (inventory.sqlCount !== 50) reasons.push(`migration SQL count is ${inventory.sqlCount}, expected 50`);
  if (inventory.journalCount !== 50) reasons.push(`migration journal entry count is ${inventory.journalCount}, expected 50`);
  if (inventory.missing.length > 0) reasons.push(`journal is missing migration tags: ${inventory.missing.join(", ")}`);
  if (inventory.extra.length > 0) reasons.push(`journal has unknown migration tags: ${inventory.extra.join(", ")}`);
  if (inventory.duplicates.length > 0) reasons.push(`journal has duplicate migration tags: ${inventory.duplicates.join(", ")}`);

  if (flags.schemaReady === "true") reasons.push("COSMIC_SCHOOL_OWNER_SCHEMA_READY is enabled");
  if (flags.state === "DUAL_WRITE" || flags.state === "OWNER_PREFERRED") reasons.push(`school ownership state is ${flags.state}`);
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

export function evaluatePostcheck(snapshot: DatabaseSnapshot, journalCount: number, flags: OwnershipFlags): GuardResult {
  const reasons: string[] = [];
  if (snapshot.publicTableCount <= 0) reasons.push("postcheck found no public application tables");
  if (!snapshot.migrationJournalExists) reasons.push("postcheck did not find the Drizzle migration journal");
  for (const [name, exists] of Object.entries(tablePresenceRow(snapshot))) {
    if (!exists) reasons.push(`postcheck table is missing: ${name}`);
  }
  if (journalCount <= 0) reasons.push("postcheck migration journal has no recorded rows");
  if (flags.schemaReady === "true") reasons.push("COSMIC_SCHOOL_OWNER_SCHEMA_READY is enabled");
  if (flags.state === "DUAL_WRITE" || flags.state === "OWNER_PREFERRED") reasons.push(`school ownership state is ${flags.state}`);
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

export async function readMigrationInventory(): Promise<MigrationInventory> {
  const entries = JSON.parse(await readFile(journalPath, "utf8")) as { entries?: Array<{ tag?: unknown }> };
  const journalTags = (entries.entries ?? []).map((entry) => String(entry.tag ?? ""));
  const files = await readdir(migrationFolderPath);
  const sqlTags = files.filter((file) => /^\d{4}_.+\.sql$/.test(file)).map((file) => file.slice(0, -4));
  const counts = new Map<string, number>();
  for (const tag of journalTags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return {
    sqlCount: sqlTags.length,
    journalCount: journalTags.length,
    missing: sqlTags.filter((tag) => !journalTags.includes(tag)),
    extra: journalTags.filter((tag) => !sqlTags.includes(tag)),
    duplicates: [...counts.entries()].filter(([, count]) => count > 1).map(([tag]) => tag),
  };
}

async function readDatabaseSnapshot(pool: Queryable): Promise<DatabaseSnapshot> {
  const tableNames = ["users", "sessions", "account_identities", "cosmic_owners", ...schoolTables];
  const presenceExpressions = [
    "to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS migration_journal_exists",
    ...tableNames.map((name) => `to_regclass('public.${name}') IS NOT NULL AS ${name}`),
  ].join(",\n      ");
  const result = await pool.query<Record<string, unknown>>(`
    SELECT current_database() AS database_name,
      current_schema() AS schema_name,
      (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS public_table_count,
      version() AS postgres_version,
      ${presenceExpressions}
  `);
  const row = result.rows[0];
  const schoolPresence = Object.fromEntries(schoolTables.map((name) => [name, bool(row[name])]));
  return {
    databaseName: String(row.database_name),
    schemaName: String(row.schema_name),
    publicTableCount: numberValue(row.public_table_count),
    migrationJournalExists: bool(row.migration_journal_exists),
    usersExists: bool(row.users),
    sessionsExists: bool(row.sessions),
    accountIdentitiesExists: bool(row.account_identities),
    cosmicOwnersExists: bool(row.cosmic_owners),
    schoolSourcesExists: bool(row.school_sources),
    schoolAssignmentsExists: bool(row.school_assignments),
    schoolTables: schoolPresence,
    postgresVersion: String(row.postgres_version),
  };
}

async function readJournalSummary(pool: Queryable) {
  const result = await pool.query<{ count: string; latest_created_at: string | null; latest_hash: string | null }>(`
    SELECT count(*)::text AS count,
      max(created_at)::text AS latest_created_at,
      (array_agg(hash ORDER BY created_at DESC))[1] AS latest_hash
    FROM drizzle.__drizzle_migrations
  `);
  const row = result.rows[0];
  return { count: Number(row.count), latestCreatedAt: row.latest_created_at, latestHash: row.latest_hash };
}

function ownershipFlags(environment = process.env): OwnershipFlags {
  return {
    schemaReady: environment.COSMIC_SCHOOL_OWNER_SCHEMA_READY,
    state: environment.COSMIC_SCHOOL_OWNERSHIP_STATE,
  };
}

export function createHostedPoolOptions(databaseUrl: string) {
  return {
    connectionString: databaseUrl,
    max: 1,
    ssl: { rejectUnauthorized: false },
  };
}

function printFailure(stage: string, reasons: string[]): never {
  console.error(`${stage} FAILED`);
  for (const reason of reasons) console.error(`- ${reason}`);
  process.exitCode = 1;
  throw new Error(`${stage} failed`);
}

export async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) printFailure("INITIALIZATION", ["DATABASE_URL is required; no connection was opened"]);

  const pool = new Pool(createHostedPoolOptions(databaseUrl));
  try {
    const inventory = await readMigrationInventory();
    const flags = ownershipFlags();
    const before = await readDatabaseSnapshot(pool);
    console.log(`Target: database=${before.databaseName} schema=${before.schemaName}`);
    console.log(`PostgreSQL: ${before.postgresVersion ?? "unavailable"}`);
    console.log(`Migrations: SQL=${inventory.sqlCount} journal=${inventory.journalCount}`);
    console.log(`Migration journal exists: ${before.migrationJournalExists ? "yes" : "no"}`);

    const precheck = evaluatePrecheck(before, inventory, flags);
    if (precheck.ok) {
      // Continue only after every fresh-database guard passes.
    } else if ("reasons" in precheck) {
      printFailure("PRECHECK", precheck.reasons);
    }

    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: migrationFolder });

    const after = await readDatabaseSnapshot(pool);
    const journal = await readJournalSummary(pool);
    const postcheck = evaluatePostcheck(after, journal.count, flags);
    if (postcheck.ok) {
      // Continue only after the migration and all postconditions pass.
    } else if ("reasons" in postcheck) {
      printFailure("POSTCHECK", postcheck.reasons);
    }

    console.log(`Migration recorded rows: ${journal.count}`);
    console.log(`Latest migration created_at: ${journal.latestCreatedAt ?? "unavailable"}`);
    console.log(`Latest migration hash prefix: ${journal.latestHash?.slice(0, 12) ?? "unavailable"}`);
    console.log("HOSTED DATABASE INITIALIZED");
  } catch (error) {
    if (process.exitCode !== 1) process.exitCode = 1;
    console.error(`INITIALIZATION ERROR: ${error instanceof Error ? error.message : "unknown error"}`);
    throw error;
  } finally {
    await pool.end();
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
