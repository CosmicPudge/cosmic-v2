import { createSession } from "@/services/auth/service";
import { sessionCookie } from "@/services/auth/localStore";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { consumeOAuthState, expiredOAuthStateCookie, getOAuthReturnTo } from "@/services/auth/oauthState";
import { exchangeAppleIdentityCode, isAppleIdentityConfigured } from "@/services/auth/identityProviders";
import { signInOrCreateSocialAccount } from "@/services/auth/social";

export const dynamic = "force-dynamic";

async function handle(request: Request, body: URLSearchParams) {
  if (!isAppleIdentityConfigured()) return Response.json({ error: "Sign in with Apple is not configured." }, { status: 503 });
  const current = await getCurrentCosmicAccount(request);
  const state = body.get("state");
  const code = body.get("code");
  if (!consumeOAuthState(request, state, current?.id, "apple") || !code) return Response.json({ error: "Invalid or expired Apple sign-in state." }, { status: 400 });

  let user: { name?: { firstName?: string; lastName?: string }; email?: string } | undefined;
  const rawUser = body.get("user");
  if (rawUser) {
    try { user = JSON.parse(rawUser) as typeof user; } catch { /* Apple only sends this on first consent; malformed optional profile is ignored. */ }
  }

  try {
    const profile = await exchangeAppleIdentityCode(code, user);
    const result = await signInOrCreateSocialAccount({ provider: "apple", ...profile }, current?.id);
    const session = current ? null : await createSession(result.account.id, request.headers.get("user-agent") ?? undefined);
    const returnTo = getOAuthReturnTo(request, state, current?.id, "apple") ?? "/account";
    const headers = new Headers({ Location: new URL(returnTo, request.url).toString(), "Set-Cookie": expiredOAuthStateCookie() });
    if (session) headers.append("Set-Cookie", sessionCookie(session.token, session.expiresAt));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Apple sign-in failed." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  return handle(request, new URLSearchParams(await request.text()));
}

export async function GET(request: Request) {
  return handle(request, new URL(request.url).searchParams);
}
