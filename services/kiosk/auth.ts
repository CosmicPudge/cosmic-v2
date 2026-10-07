import "server-only";

import { getCurrentCosmicSession, kioskBootId } from "@/services/auth/server";
import { getAuthRepository } from "@/services/auth/repository";
import { hashSessionToken, parseSessionCookie } from "@/services/auth/localStore";
import { isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";
import { classifyKioskAuth, type KioskAuthDebug } from "@/services/kiosk/kioskAuthPolicy";

type KioskSession = NonNullable<Awaited<ReturnType<typeof getCurrentCosmicSession>>>;

export type DeveloperKioskSessionResult =
  | { status: "not-found" }
  | { status: "unavailable" }
  | { status: "unauthorized" }
  | { status: "authenticated"; session: KioskSession };

export type DeveloperKioskAuthDebug = KioskAuthDebug;

export async function inspectDeveloperKioskSession(request: Request): Promise<DeveloperKioskAuthDebug> {
  const token = parseSessionCookie(request);
  if (!token) return classifyKioskAuth({ cookiePresent: false, sessionFound: false, sessionKind: "none", bootBound: false, bootMatch: false });
  const session = await getAuthRepository().findSession(hashSessionToken(token));
  if (!session) return classifyKioskAuth({ cookiePresent: true, sessionFound: false, sessionKind: "none", bootBound: false, bootMatch: false });
  const bootId = kioskBootId(request);
  const bootBound = Boolean(session.authenticatedBootId);
  const bootMatch = Boolean(bootId && session.authenticatedBootId === bootId);
  const sessionKind = session.sessionType === "device" ? "device" : "user";
  return classifyKioskAuth({ cookiePresent: true, sessionFound: true, sessionKind, bootBound, bootMatch });
}

export function kioskAuthDebugEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
}

export function logDeveloperKioskAuth(route: "data" | "diagnostics" | "redeem", debug: DeveloperKioskAuthDebug) {
  if (!kioskAuthDebugEnabled()) return;
  console.info(`[kiosk-auth-debug] route=${route} cookiePresent=${debug.cookiePresent} sessionLookup=${debug.sessionLookup} sessionKind=${debug.sessionKind} bootBound=${debug.bootBound} bootMatch=${debug.bootMatch} authResult=${debug.authResult}`);
}

export async function getDeveloperKioskSession(request: Request): Promise<DeveloperKioskSessionResult> {
  if (!isDeveloperKioskRequest(request)) return { status: "not-found" };
  try {
    const session = await getCurrentCosmicSession(request, { allowUser: false, allowDevice: true, bootId: kioskBootId(request) });
    return session ? { status: "authenticated", session } : { status: "unauthorized" };
  } catch {
    return { status: "unavailable" };
  }
}
