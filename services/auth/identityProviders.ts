import "server-only";

import { createPrivateKey, createPublicKey, sign as cryptoSign, verify as cryptoVerify, type JsonWebKey as NodeJsonWebKey } from "node:crypto";

export const GOOGLE_IDENTITY_SCOPES = ["openid", "email", "profile"] as const;
export const MICROSOFT_IDENTITY_SCOPES = ["openid", "profile", "email", "User.Read"] as const;
export const APPLE_IDENTITY_SCOPES = ["name", "email"] as const;

export function isGoogleIdentityConfigured() { return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_IDENTITY_REDIRECT_URI); }
export function googleIdentityRedirectUri() { return process.env.GOOGLE_IDENTITY_REDIRECT_URI!; }
export function isMicrosoftIdentityConfigured() { return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && process.env.MICROSOFT_IDENTITY_REDIRECT_URI); }
export function microsoftIdentityRedirectUri() { return process.env.MICROSOFT_IDENTITY_REDIRECT_URI!; }
export function isAppleIdentityConfigured() { return Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY && process.env.APPLE_REDIRECT_URI); }
export function appleIdentityRedirectUri() { return process.env.APPLE_REDIRECT_URI!; }

export function appleIdentityConfiguration() { return isAppleIdentityConfigured() ? "configured" as const : "not_configured" as const; }

export interface ProviderIdentityProfile { subject: string; email?: string; displayName?: string; }

function base64urlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function applePrivateKey() {
  const raw = process.env.APPLE_PRIVATE_KEY!;
  return createPrivateKey(raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw);
}

function createAppleClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlJson({ alg: "ES256", kid: process.env.APPLE_KEY_ID! });
  const payload = base64urlJson({
    iss: process.env.APPLE_TEAM_ID!,
    iat: now,
    exp: now + 5 * 60,
    aud: "https://appleid.apple.com",
    sub: process.env.APPLE_CLIENT_ID!,
  });
  const signingInput = `${header}.${payload}`;
  const signature = cryptoSign("sha256", Buffer.from(signingInput), { key: applePrivateKey(), dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${signingInput}.${signature}`;
}

export async function exchangeGoogleIdentityCode(code: string): Promise<{ access_token: string }> {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: googleIdentityRedirectUri(), grant_type: "authorization_code" }) });
  if (!response.ok) throw new Error("Google identity sign-in failed.");
  const token = await response.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Google identity token is missing.");
  return { access_token: token.access_token };
}

export async function verifyGoogleIdentity(accessToken: string): Promise<ProviderIdentityProfile> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Google identity could not be verified.");
  const profile = await response.json() as { sub?: string; email?: string; name?: string; email_verified?: boolean };
  if (!profile.sub || (profile.email && profile.email_verified === false)) throw new Error("Google identity is incomplete.");
  return { subject: profile.sub, ...(profile.email ? { email: profile.email } : {}), ...(profile.name ? { displayName: profile.name } : {}) };
}

export function microsoftIdentityAuthorizationUrl(state: string) { if (!isMicrosoftIdentityConfigured()) throw new Error("Microsoft sign-in is not configured."); const query = new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID!, redirect_uri: microsoftIdentityRedirectUri(), response_type: "code", response_mode: "query", scope: MICROSOFT_IDENTITY_SCOPES.join(" "), state }); return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${query}`; }

export async function exchangeMicrosoftIdentityCode(code: string): Promise<{ access_token: string }> { const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID!, client_secret: process.env.MICROSOFT_CLIENT_SECRET!, redirect_uri: microsoftIdentityRedirectUri(), grant_type: "authorization_code", code, scope: MICROSOFT_IDENTITY_SCOPES.join(" ") }) }); if (!response.ok) throw new Error("Microsoft identity sign-in failed."); const token = await response.json() as { access_token?: string }; if (!token.access_token) throw new Error("Microsoft identity token is missing."); return { access_token: token.access_token }; }

export async function verifyMicrosoftIdentity(accessToken: string): Promise<ProviderIdentityProfile> {
  const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Microsoft identity could not be verified.");
  const profile = await response.json() as { id?: string; displayName?: string; mail?: string; userPrincipalName?: string };
  const email = profile.mail ?? profile.userPrincipalName;
  if (!profile.id) throw new Error("Microsoft identity is incomplete.");
  return { subject: profile.id, ...(email ? { email } : {}), ...(profile.displayName ? { displayName: profile.displayName } : {}) };
}

type AppleTokenPayload = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
};

async function verifyAppleIdToken(idToken: string): Promise<AppleTokenPayload> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Apple identity token is invalid.");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as { alg?: string; kid?: string };
  if (header.alg !== "RS256" || !header.kid) throw new Error("Apple identity token is invalid.");
  const jwksResponse = await fetch("https://appleid.apple.com/auth/keys", { cache: "no-store" });
  if (!jwksResponse.ok) throw new Error("Apple identity keys are unavailable.");
  const jwks = await jwksResponse.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
  const jwk = jwks.keys?.find((item) => item.kid === header.kid);
  if (!jwk) throw new Error("Apple identity key is unavailable.");
  const publicKey = createPublicKey({ key: jwk as unknown as NodeJsonWebKey, format: "jwk" });
  const verified = cryptoVerify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, Buffer.from(parts[2], "base64url"));
  if (!verified) throw new Error("Apple identity token could not be verified.");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as AppleTokenPayload;
  const audience = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  if (payload.iss !== "https://appleid.apple.com" || !audience.includes(process.env.APPLE_CLIENT_ID!) || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000) || !payload.sub) throw new Error("Apple identity token is invalid or expired.");
  return payload;
}

export async function exchangeAppleIdentityCode(code: string, user?: { name?: { firstName?: string; lastName?: string }; email?: string }): Promise<ProviderIdentityProfile> {
  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID!,
      client_secret: createAppleClientSecret(),
      code,
      grant_type: "authorization_code",
      redirect_uri: appleIdentityRedirectUri(),
    }),
    cache: "no-store",
  });
  const token = await response.json() as { id_token?: string; error?: string };
  if (!response.ok || !token.id_token) throw new Error(token.error ? `Apple sign-in failed: ${token.error}.` : "Apple sign-in failed.");
  const payload = await verifyAppleIdToken(token.id_token);
  const verifiedEmail = payload.email_verified === true || payload.email_verified === "true";
  const email = verifiedEmail ? payload.email : user?.email;
  const displayName = [user?.name?.firstName, user?.name?.lastName].filter(Boolean).join(" ").trim() || undefined;
  return { subject: payload.sub!, ...(email ? { email } : {}), ...(displayName ? { displayName } : {}) };
}
