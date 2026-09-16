import "server-only";
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { safeReturnUrl } from "./returnUrl";

const COOKIE = "cosmic_oauth_state";
const PKCE_COOKIE = "cosmic_oauth_pkce";
const TTL_MS = 10 * 60 * 1000;
const KNOWN_PROVIDERS = new Set(["google", "microsoft", "spotify"]);
export type OAuthOwnerKind = "personal" | "legacy-account";
const secret = () => process.env.COSMIC_AUTH_SECRET ?? "cosmic-local-development-oauth-secret";
const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

export function createOAuthState(accountId?: string, returnTo?: string, provider?: string, ownerKind?: OAuthOwnerKind) {
  const encodedReturnTo = returnTo ? Buffer.from(safeReturnUrl(returnTo, "/")).toString("base64url") : "";
  const value = `${randomUUID()}|${accountId ?? "local"}|${Date.now() + TTL_MS}|${encodedReturnTo}|${provider ?? ""}|${ownerKind ?? ""}`;
  const payload = `${Buffer.from(value).toString("base64url")}.${sign(value)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return { state: value.split("|")[0], cookie: `${COOKIE}=${payload}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=600${secure}` };
}

export function consumeOAuthState(request: Request, state: string | null, accountId?: string, provider?: string, ownerKind?: OAuthOwnerKind) {
  return readOAuthState(request, state, accountId, provider, ownerKind) !== null;
}

export function getOAuthReturnTo(request: Request, state: string | null, accountId?: string, provider?: string, ownerKind?: OAuthOwnerKind) {
  const value = readOAuthState(request, state, accountId, provider, ownerKind);
  if (!value) return null;
  const encoded = value.split("|")[3];
  if (!encoded) return null;
  try { return safeReturnUrl(Buffer.from(encoded, "base64url").toString("utf8"), "/"); } catch { return "/"; }
}

function readOAuthState(request: Request, state: string | null, accountId?: string, provider?: string, ownerKind?: OAuthOwnerKind) {
  if (!state) return null;
  const raw = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;
  try {
    const value = Buffer.from(encoded, "base64url").toString("utf8");
    const expected = Buffer.from(sign(value)); const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const [storedState, storedAccount, expires, , storedProvider, storedOwnerKind] = value.split("|");
    return storedState === state && Number(expires) > Date.now() && storedAccount === (accountId ?? "local") && KNOWN_PROVIDERS.has(storedProvider) && (!provider || storedProvider === provider) && (!ownerKind || storedOwnerKind === ownerKind) ? value : null;
  } catch { return null; }
}

export function createOAuthPkceTransaction(state: string) {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const expires = Date.now() + TTL_MS;
  const value = `${state}|${expires}|${verifier}`;
  const payload = `${Buffer.from(value).toString("base64url")}.${sign(value)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return { verifier, challenge, cookie: `${PKCE_COOKIE}=${payload}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=600${secure}` };
}

export function consumeOAuthPkceVerifier(request: Request, state: string | null) {
  if (!state) return null;
  const raw = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${PKCE_COOKIE}=`))?.slice(PKCE_COOKIE.length + 1);
  if (!raw) return null;
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;
  try {
    const value = Buffer.from(encoded, "base64url").toString("utf8");
    const expected = Buffer.from(sign(value)); const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const [storedState, expires, verifier] = value.split("|");
    return storedState === state && Number(expires) > Date.now() && verifier ? verifier : null;
  } catch { return null; }
}

export function expiredOAuthStateCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function expiredOAuthPkceCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${PKCE_COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
