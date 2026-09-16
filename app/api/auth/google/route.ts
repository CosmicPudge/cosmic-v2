import { getGoogleAuthorizationUrl } from "@/services/mail/gmail";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { createOAuthPkceTransaction, createOAuthState } from "@/services/auth/oauthState";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("returnTo") ?? undefined;
  const personal = resolvePrivateRequestContext(request, "private-personal");
  if (personal) {
    const state = createOAuthState(undefined, returnTo, "google", "personal");
    const pkce = createOAuthPkceTransaction(state.state);
    try {
      const headers = new Headers({ Location: getGoogleAuthorizationUrl(state.state, pkce.challenge) });
      headers.append("Set-Cookie", state.cookie);
      headers.append("Set-Cookie", pkce.cookie);
      return new Response(null, { status: 302, headers });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Gmail OAuth is unavailable." }, { status: 503 });
    }
  }
  const account = await getCurrentCosmicAccount(request);
  if (!account) return Response.json({ error: "Sign in before connecting Gmail." }, { status: 401 });
  const state = createOAuthState(account.id, returnTo, "google", "legacy-account");
  try { return new Response(null, { status: 302, headers: { Location: getGoogleAuthorizationUrl(state.state), "Set-Cookie": state.cookie } }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Gmail OAuth is unavailable." }, { status: 503 }); }
}
