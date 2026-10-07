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
  | { status: "unauthorized"; diagnostics: DeveloperKioskAuthDebug }
  | { status: "authenticated"; session: KioskSession };

export type DeveloperKioskAuthDebug = KioskAuthDebug;
export type DeveloperKioskAuthStatus = DeveloperKioskAuthDebug & { bootQueryPresent: boolean; expired: boolean };

async function readDeveloperKioskAuth(request: Request) {
  const token = parseSessionCookie(request);
  if (!token) return { debug: classifyKioskAuth({ cookiePresent: false, sessionFound: false, sessionKind: "none", bootBound: false, bootMatch: false }), session: null };
  const lookup = await getAuthRepository().findSessionLookup(hashSessionToken(token));
  const session = lookup.status === "miss" ? null : lookup.session;
  if (!session) return { debug: classifyKioskAuth({ cookiePresent: true, sessionFound: false, sessionKind: "none", bootBound: false, bootMatch: false }), session: null };
  const bootId = kioskBootId(request);
  const bootBound = Boolean(session.authenticatedBootId);
  const bootMatch = Boolean(bootId && session.authenticatedBootId === bootId);
  const sessionKind = session.sessionType === "device" ? "device" : "user";
  return { debug: classifyKioskAuth({ cookiePresent: true, sessionFound: lookup.status === "hit", sessionKind, bootBound, bootMatch, sessionExpired: lookup.status === "expired" }), session };
}

function authStatus(request: Request, debug: DeveloperKioskAuthDebug): DeveloperKioskAuthStatus {
  const bootQueryPresent = Boolean(new URL(request.url).searchParams.get("cosmic-boot")?.trim());
  return { ...debug, bootQueryPresent, expired: debug.authResult === "expired" };
}

export async function inspectDeveloperKioskSession(request: Request): Promise<DeveloperKioskAuthDebug> {
  return (await readDeveloperKioskAuth(request)).debug;
}

export async function inspectDeveloperKioskAuthStatus(request: Request): Promise<DeveloperKioskAuthStatus> {
  return authStatus(request, (await readDeveloperKioskAuth(request)).debug);
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
    const inspected = await readDeveloperKioskAuth(request);
    const session = await getCurrentCosmicSession(request, { allowUser: false, allowDevice: true, bootId: kioskBootId(request) });
    if (inspected.debug.authResult !== "ok") return { status: "unauthorized", diagnostics: inspected.debug };
    return session ? { status: "authenticated", session } : { status: "unauthorized", diagnostics: { ...inspected.debug, authResult: "unknown" } };
  } catch {
    return { status: "unavailable" };
  }
}
