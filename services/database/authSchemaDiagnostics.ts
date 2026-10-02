import "server-only";

import { sql } from "drizzle-orm";
import { getDatabase, isDatabaseConfigured } from "./client";
import { classifySigninDatabaseError, type SigninCategory } from "@/services/auth/signinDiagnostics";

const REQUIRED_COLUMNS = {
  users: ["id", "email", "normalized_email", "password_hash", "password_salt", "display_name", "status", "created_at", "updated_at"],
  sessions: ["id", "user_id", "session_token_hash", "created_at", "expires_at", "last_used_at", "revoked_at", "user_agent", "session_type", "device_id", "authenticated_boot_id"],
  account_moderation: ["account_id", "status", "expires_at"],
} as const;

type SchemaStatus = {
  tableExists: boolean;
  requiredColumnsExist: boolean;
};

export type AuthSchemaDiagnostics = {
  databaseConnectionSucceeded: boolean;
  users: SchemaStatus;
  sessions: SchemaStatus;
  accountAccess: SchemaStatus;
  migrationMismatch: boolean;
  errorCategory: SigninCategory | null;
  sessionWriteCapability: "not-tested-read-only";
};

function emptyStatus(): SchemaStatus {
  return { tableExists: false, requiredColumnsExist: false };
}

function rowsFromResult(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
  if (value && typeof value === "object" && "rows" in value && Array.isArray(value.rows)) return value.rows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
  return [];
}

export async function checkAuthSchema(): Promise<AuthSchemaDiagnostics> {
  const base: AuthSchemaDiagnostics = {
    databaseConnectionSucceeded: false,
    users: emptyStatus(),
    sessions: emptyStatus(),
    accountAccess: emptyStatus(),
    migrationMismatch: false,
    errorCategory: null,
    sessionWriteCapability: "not-tested-read-only",
  };
  if (!isDatabaseConfigured()) return { ...base, errorCategory: "database-error" };

  try {
    const result = await getDatabase().execute(sql`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name in ('users', 'sessions', 'account_moderation')
    `);
    const rows = rowsFromResult(result);
    const columns = new Map<string, Set<string>>();
    for (const row of rows) {
      const table = typeof row.table_name === "string" ? row.table_name : "";
      const column = typeof row.column_name === "string" ? row.column_name : "";
      if (!table || !column) continue;
      const tableColumns = columns.get(table) ?? new Set<string>();
      tableColumns.add(column);
      columns.set(table, tableColumns);
    }
    const statusFor = (table: keyof typeof REQUIRED_COLUMNS): SchemaStatus => {
      const tableColumns = columns.get(table) ?? new Set<string>();
      return { tableExists: tableColumns.size > 0, requiredColumnsExist: REQUIRED_COLUMNS[table].every((column) => tableColumns.has(column)) };
    };
    const users = statusFor("users");
    const sessions = statusFor("sessions");
    const accountAccess = statusFor("account_moderation");
    const migrationMismatch = !users.requiredColumnsExist || !sessions.requiredColumnsExist || !accountAccess.requiredColumnsExist;
    return { ...base, databaseConnectionSucceeded: true, users, sessions, accountAccess, migrationMismatch, errorCategory: migrationMismatch ? "migration-mismatch" : null };
  } catch (error) {
    return { ...base, errorCategory: classifySigninDatabaseError(error) };
  }
}
