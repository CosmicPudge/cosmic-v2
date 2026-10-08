import { getCurrentCosmicAccount } from "@/services/auth/server";
import { createOAuthState } from "@/services/auth/oauthState";
import { APPLE_IDENTITY_SCOPES, appleIdentityRedirectUri, isAppleIdentityConfigured } from "@/services/auth/identityProviders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAppleIdentityConfigured()) return Response.json({ error: "Sign in with Apple is not configured." }, { status: 503 });
  const account = await getCurrentCosmicAccount(request);
  const url = new URL(request.url);
  const state = createOAuthState(account?.id, url.searchParams.get("returnTo") ?? "/account", "apple");
  const authorize = new URL("https://appleid.apple.com/auth/authorize");
  authorize.search = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: appleIdentityRedirectUri(),
    response_type: "code",
    response_mode: "form_post",
    scope: APPLE_IDENTITY_SCOPES.join(" "),
    state: state.state,
  }).toString();
  return new Response(null, { status: 302, headers: { Location: authorize.toString(), "Set-Cookie": state.cookie } });
}
