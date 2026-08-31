import { createSession } from "@/services/auth/service";
import { sessionCookie } from "@/services/auth/localStore";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { consumeOAuthState, expiredOAuthStateCookie, getOAuthReturnTo } from "@/services/auth/oauthState";
import { exchangeGoogleIdentityCode, verifyGoogleIdentity } from "@/services/auth/identityProviders";
import { signInOrCreateSocialAccount } from "@/services/auth/social";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url); const current = await getCurrentCosmicAccount(request); const state = url.searchParams.get("state");
  if (!consumeOAuthState(request, state, current?.id, "google") || !url.searchParams.get("code")) return Response.json({ error: "Invalid or expired Google sign-in state." }, { status: 400 });
  try { const token = await exchangeGoogleIdentityCode(url.searchParams.get("code")!); const profile = await verifyGoogleIdentity(token.access_token); const result = await signInOrCreateSocialAccount({ provider: "google", ...profile }, current?.id); const session = current ? null : await createSession(result.account.id, request.headers.get("user-agent") ?? undefined); const returnTo = getOAuthReturnTo(request, state, current?.id) ?? "/account"; const headers = new Headers({ Location: new URL(returnTo, request.url).toString(), "Set-Cookie": expiredOAuthStateCookie() }); if (session) headers.append("Set-Cookie", sessionCookie(session.token, session.expiresAt)); return new Response(null, { status: 302, headers }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Google sign-in failed." }, { status: 400 }); }
}
