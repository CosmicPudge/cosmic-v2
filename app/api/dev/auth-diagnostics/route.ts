import { isDatabaseConfigured } from "@/services/database/client";
import { checkDatabase } from "@/services/database/client";
import { checkAuthSchema } from "@/services/database/authSchemaDiagnostics";
import { getSession } from "@/services/auth/service";
import { parseSessionCookie } from "@/services/auth/localStore";
import { isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";

export const dynamic = "force-dynamic";

type ErrorCategory = "no-cookie" | "auth-unconfigured" | "database-error" | "session-not-found" | "account-not-found" | "unknown";

function authMode(databaseConfigured: boolean): "database" | "local" | "unconfigured" {
  if (databaseConfigured) return "database";
  return process.env.NODE_ENV === "production" ? "unconfigured" : "local";
}

export async function GET(request: Request) {
  if (!isDeveloperKioskRequest(request)) return Response.json({ error: "Not found" }, { status: 404 });

  const databaseConfigured = isDatabaseConfigured();
  const mode = authMode(databaseConfigured);
  const cookiePresent = Boolean(parseSessionCookie(request));
  const base = {
    host: new URL(request.url).hostname,
    authMode: mode,
    databaseConfigured,
    ownerConfigured: Boolean(process.env.COSMIC_OWNER_USER_ID?.trim()),
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    sessionCookiePresent: cookiePresent,
    sessionLookupSucceeded: false,
    accountFound: false,
    dogfoodMode: process.env.COSMIC_DOGFOOD_MODE?.trim() === "1",
  };

  const database = mode === "database" ? await checkDatabase() : { configured: false, connected: false };
  const authSchema = mode === "database" ? await checkAuthSchema() : null;

  if (!cookiePresent) return Response.json({ ...base, database, authSchema, errorCategory: "no-cookie" satisfies ErrorCategory }, { headers: { "Cache-Control": "no-store" } });
  if (mode === "unconfigured") return Response.json({ ...base, database, authSchema, errorCategory: "auth-unconfigured" satisfies ErrorCategory }, { headers: { "Cache-Control": "no-store" } });

  try {
    const session = await getSession(request);
    if (!session) return Response.json({ ...base, database, authSchema, sessionLookupSucceeded: true, errorCategory: "session-not-found" satisfies ErrorCategory }, { headers: { "Cache-Control": "no-store" } });
    return Response.json({ ...base, database, authSchema, sessionLookupSucceeded: true, accountFound: Boolean(session.account), errorCategory: null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    const category: ErrorCategory = mode === "database" ? "database-error" : "unknown";
    return Response.json({ ...base, database, authSchema, errorCategory: category }, { headers: { "Cache-Control": "no-store" } });
  }
}
