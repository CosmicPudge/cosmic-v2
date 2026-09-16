import { getCurrentCosmicAccount } from "@/services/auth/server";
import { createOAuthPkceTransaction, createOAuthState } from "@/services/auth/oauthState";
import { getOutlookAuthorizationUrl } from "@/services/mail/outlook";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("returnTo") ?? undefined;
  if (resolvePrivateRequestContext(request, "private-personal")) {
    const state = createOAuthState(undefined, returnTo, "microsoft", "personal");
    const pkce = createOAuthPkceTransaction(state.state);
    try {
      const headers = new Headers({ Location: getOutlookAuthorizationUrl(state.state, pkce.challenge) });
      headers.append("Set-Cookie", state.cookie);
      headers.append("Set-Cookie", pkce.cookie);
      return new Response(null, { status: 302, headers });
    } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Outlook OAuth is unavailable." }, { status: 503 }); }
  }
  const account = await getCurrentCosmicAccount(request);
  if (!account) return Response.json({ error: "Sign in before connecting Outlook." }, { status: 401 });
  const state = createOAuthState(account.id, returnTo, "microsoft", "legacy-account");
  try { return new Response(null, { status: 302, headers: { Location: getOutlookAuthorizationUrl(state.state), "Set-Cookie": state.cookie } }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Outlook OAuth is unavailable." }, { status: 503 }); }
}
