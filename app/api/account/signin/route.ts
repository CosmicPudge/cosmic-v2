import { authenticateAccount, createSession } from "@/services/auth/service";
import { sessionCookie } from "@/services/auth/localStore";
import { authErrorResponse } from "@/services/auth/http";
import { classifySigninDatabaseError, createSigninStageLogger, logSigninCategory, type SigninCategory } from "@/services/auth/signinDiagnostics";

function isDeveloperSigninDiagnosticsRequest(request: Request) {
  if (process.env.COSMIC_KIOSK_ENABLED !== "true" && process.env.COSMIC_DEV_KIOSK_ENABLED !== "true") return false;
  const hostname = new URL(request.url).hostname.toLowerCase();
  const configuredHost = (process.env.COSMIC_KIOSK_HOSTNAME ?? "dev.cosmicpudge.shop").toLowerCase().split(":")[0];
  return hostname === configuredHost || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(hostname));
}

export async function POST(request: Request) {
  const nonProductionDeployment = process.env.VERCEL_ENV ? process.env.VERCEL_ENV !== "production" : process.env.NODE_ENV !== "production";
  const diagnosticsEnabled = nonProductionDeployment && isDeveloperSigninDiagnosticsRequest(request);
  const diagnostics = createSigninStageLogger(diagnosticsEnabled);
  let category: SigninCategory = "unknown";
  try {
    const body = await request.json() as { email?: string; password?: string };
    const account = await authenticateAccount(body.email ?? "", body.password ?? "", (stage, stageCategory) => {
      diagnostics?.(stage, stageCategory);
      if (stageCategory) category = stageCategory;
    });
    diagnostics?.("session-start");
    let session;
    try {
      session = await createSession(account.id, request.headers.get("user-agent") ?? undefined);
    } catch (error) {
      category = classifySigninDatabaseError(error, "session-write-error");
      diagnostics?.("session-write-error", category);
      throw error;
    }
    diagnostics?.("session-success");
    const cookie = sessionCookie(session.token, session.expiresAt);
    diagnostics?.("cookie-ready");
    return Response.json({ account, expiresAt: session.expiresAt }, { headers: { "Set-Cookie": cookie } });
  } catch (error) {
    if (!category || category === "unknown") category = classifySigninDatabaseError(error);
    logSigninCategory(diagnosticsEnabled, category);
    return authErrorResponse(error, "Sign in failed.", 401);
  }
}
