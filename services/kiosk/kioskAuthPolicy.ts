export type KioskAuthSessionKind = "device" | "user" | "none";
export type KioskAuthFailureReason = "ok" | "missing-cookie" | "session-miss" | "wrong-kind" | "boot-mismatch" | "expired" | "unknown";

export type KioskAuthDebug = {
  cookiePresent: boolean;
  sessionLookup: "hit" | "miss" | "not-attempted";
  sessionKind: KioskAuthSessionKind;
  bootBound: boolean;
  bootMatch: boolean;
  authResult: KioskAuthFailureReason;
};

export function classifyKioskAuth(input: { cookiePresent: boolean; sessionFound: boolean; sessionKind: KioskAuthSessionKind; bootBound: boolean; bootMatch: boolean; sessionExpired?: boolean }): KioskAuthDebug {
  if (!input.cookiePresent) return { cookiePresent: false, sessionLookup: "miss", sessionKind: "none", bootBound: false, bootMatch: false, authResult: "missing-cookie" };
  if (input.sessionExpired) return { cookiePresent: true, sessionLookup: "hit", sessionKind: input.sessionKind, bootBound: input.bootBound, bootMatch: input.bootMatch, authResult: "expired" };
  if (!input.sessionFound) return { cookiePresent: true, sessionLookup: "miss", sessionKind: "none", bootBound: false, bootMatch: false, authResult: "session-miss" };
  const authResult = input.sessionKind !== "device" ? "wrong-kind" : !input.bootMatch ? "boot-mismatch" : "ok";
  return { cookiePresent: true, sessionLookup: "hit", sessionKind: input.sessionKind, bootBound: input.bootBound, bootMatch: input.bootMatch, authResult };
}
