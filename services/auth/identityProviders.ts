export const GOOGLE_IDENTITY_SCOPES = ["openid", "email", "profile"] as const;
export const MICROSOFT_IDENTITY_SCOPES = ["openid", "profile", "email", "User.Read"] as const;

export function isGoogleIdentityConfigured() { return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && (process.env.GOOGLE_IDENTITY_REDIRECT_URI ?? process.env.GOOGLE_REDIRECT_URI)); }
export function googleIdentityRedirectUri() { return process.env.GOOGLE_IDENTITY_REDIRECT_URI ?? process.env.GOOGLE_REDIRECT_URI!; }
export function isMicrosoftIdentityConfigured() { return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && (process.env.MICROSOFT_IDENTITY_REDIRECT_URI ?? process.env.MICROSOFT_REDIRECT_URI)); }
export function microsoftIdentityRedirectUri() { return process.env.MICROSOFT_IDENTITY_REDIRECT_URI ?? process.env.MICROSOFT_REDIRECT_URI!; }
export function isAppleIdentityConfigured() { return Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY); }

export function appleIdentityConfiguration() { return isAppleIdentityConfigured() ? "configured" as const : "not_configured" as const; }

export interface ProviderIdentityProfile { subject: string; email?: string; displayName?: string; }

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

export async function verifyMicrosoftIdentity(accessToken: string): Promise<ProviderIdentityProfile> {
  const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Microsoft identity could not be verified.");
  const profile = await response.json() as { id?: string; displayName?: string; mail?: string; userPrincipalName?: string };
  const email = profile.mail ?? profile.userPrincipalName;
  if (!profile.id) throw new Error("Microsoft identity is incomplete.");
  return { subject: profile.id, ...(email ? { email } : {}), ...(profile.displayName ? { displayName: profile.displayName } : {}) };
}
