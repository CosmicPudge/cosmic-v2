import { getDatabase } from "@/services/database/client";
import { classifyConnectionFailure, safeDatabaseClientName, safeDatabaseErrorCode } from "@/services/database/connectionDiagnostics";
import { classifyDatabaseRuntime } from "@/services/database/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isDeveloperDiagnosticRequest(request: Request) {
  if (process.env.COSMIC_DEV_KIOSK_ENABLED !== "true") return false;
  const hostname = new URL(request.url).hostname.toLowerCase();
  const configuredHost = (process.env.COSMIC_KIOSK_HOSTNAME ?? "dev.cosmicpudge.shop").toLowerCase().split(":")[0];
  return hostname === configuredHost || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(hostname));
}

export async function GET(request: Request) {
  if (!isDeveloperDiagnosticRequest(request)) return Response.json({ error: "Not found" }, { status: 404 });

  const runtimeConfig = classifyDatabaseRuntime();
  const base = {
    connected: false,
    client: safeDatabaseClientName(process.env.DATABASE_DRIVER?.trim() || "neon"),
    runtime: "node" as const,
    failureCategory: null as string | null,
    safeCode: null as string | null,
  };

  if (!runtimeConfig.urlPresent || runtimeConfig.driver === "invalid" || runtimeConfig.driver === "missing") {
    return Response.json({ ...base, failureCategory: runtimeConfig.driver === "invalid" ? "parse-error" : "unknown" }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    await getDatabase().execute("SELECT 1");
    return Response.json(base, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ ...base, failureCategory: classifyConnectionFailure(error), safeCode: safeDatabaseErrorCode(error) }, { headers: { "Cache-Control": "no-store" } });
  }
}
