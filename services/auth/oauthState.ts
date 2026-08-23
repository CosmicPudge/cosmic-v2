import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const COOKIE = "cosmic_oauth_state";
const TTL_MS = 10 * 60 * 1000;
const secret = () => process.env.COSMIC_AUTH_SECRET ?? "cosmic-local-development-oauth-secret";
const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

export function createOAuthState(accountId?: string) {
  const value = `${randomUUID()}|${accountId ?? "local"}|${Date.now() + TTL_MS}`;
  const payload = `${Buffer.from(value).toString("base64url")}.${sign(value)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return { state: value.split("|")[0], cookie: `${COOKIE}=${payload}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=600${secure}` };
}

export function consumeOAuthState(request: Request, state: string | null, accountId?: string) {
  if (!state) return false;
  const raw = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return false;
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return false;
  try {
    const value = Buffer.from(encoded, "base64url").toString("utf8");
    const expected = Buffer.from(sign(value)); const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
    const [storedState, storedAccount, expires] = value.split("|");
    return storedState === state && Number(expires) > Date.now() && storedAccount === (accountId ?? "local");
  } catch { return false; }
}

export function expiredOAuthStateCookie() { return `${COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0`; }
