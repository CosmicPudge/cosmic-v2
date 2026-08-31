import { getCurrentCosmicAccount } from "@/services/auth/server";
import { createOAuthState } from "@/services/auth/oauthState";
import { googleIdentityRedirectUri, GOOGLE_IDENTITY_SCOPES, isGoogleIdentityConfigured } from "@/services/auth/identityProviders";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!isGoogleIdentityConfigured()) return Response.json({ error: "Google sign-in is not configured." }, { status: 503 });
  const account = await getCurrentCosmicAccount(request);
  const url = new URL(request.url);
  const state = createOAuthState(account?.id, url.searchParams.get("returnTo") ?? "/account", "google");
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: googleIdentityRedirectUri(), response_type: "code", scope: GOOGLE_IDENTITY_SCOPES.join(" "), state: state.state, access_type: "online", prompt: "select_account" }).toString();
  return new Response(null, { status: 302, headers: { Location: authorize.toString(), "Set-Cookie": state.cookie } });
}
