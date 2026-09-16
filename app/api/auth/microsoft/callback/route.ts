import { requireCosmicAccount } from "@/services/auth/server";
import { consumeOAuthPkceVerifier, consumeOAuthState, expiredOAuthPkceCookie, expiredOAuthStateCookie, getOAuthReturnTo } from "@/services/auth/oauthState";
import { exchangeMicrosoftCode, storeAccountOutlookToken, storePersonalOutlookToken } from "@/services/mail/outlook";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (resolvePrivateRequestContext(request, "private-personal")) {
    const verifier = consumeOAuthPkceVerifier(request, state);
    if (!consumeOAuthState(request, state, undefined, "microsoft", "personal") || !verifier || !code) return Response.json({ error: "Invalid or expired personal Microsoft OAuth state." }, { status: 400 });
    try {
      await storePersonalOutlookToken(await exchangeMicrosoftCode(code, verifier));
      const returnTo = getOAuthReturnTo(request, state, undefined, "microsoft", "personal") ?? "/outlook?connected=outlook";
      const headers = new Headers({ Location: new URL(returnTo, request.url).toString() });
      headers.append("Set-Cookie", expiredOAuthStateCookie());
      headers.append("Set-Cookie", expiredOAuthPkceCookie());
      return new Response(null, { status: 302, headers });
    } catch { return Response.json({ error: "Personal Outlook connection failed." }, { status: 502 }); }
  }
  let account;
  try { account = await requireCosmicAccount(request); }
  catch { return Response.json({ error: "Sign in before connecting Outlook." }, { status: 401 }); }
  if (!consumeOAuthState(request, state, account.id, "microsoft", "legacy-account") || !code) return Response.json({ error: "Invalid or expired OAuth state." }, { status: 400 });
  try {
    await storeAccountOutlookToken(account.id, await exchangeMicrosoftCode(code));
    const returnTo = getOAuthReturnTo(request, state, account.id, "microsoft", "legacy-account") ?? "/account?connected=outlook";
    return new Response(null, { status: 302, headers: { Location: new URL(returnTo, request.url).toString(), "Set-Cookie": expiredOAuthStateCookie() } });
  } catch { return Response.json({ error: "Outlook connection failed." }, { status: 502 }); }
}
