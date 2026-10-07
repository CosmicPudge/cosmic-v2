export type KioskAuthSessionKind = "device" | "user" | "none";
export type KioskAuthFailureReason = "ok" | "missing-cookie" | "session-miss" | "wrong-kind" | "boot-mismatch";

export type KioskAuthDebug = {
  cookiePresent: boolean;
  sessionLookup: "hit" | "miss";
  sessionKind: KioskAuthSessionKind;
  bootBound: boolean;
  bootMatch: boolean;
  authResult: KioskAuthFailureReason;
};

export function classifyKioskAuth(input: { cookiePresent: boolean; sessionFound: boolean; sessionKind: KioskAuthSessionKind; bootBound: boolean; bootMatch: boolean }): KioskAuthDebug {
  if (!input.cookiePresent) return { ...input, sessionLookup: "miss", authResult: "missing-cookie" };
  if (!input.sessionFound) return { ...input, sessionLookup: "miss", authResult: "session-miss" };
  const authResult = input.sessionKind !== "device" ? "wrong-kind" : !input.bootMatch ? "boot-mismatch" : "ok";
  return { ...input, sessionLookup: "hit", authResult };
}
