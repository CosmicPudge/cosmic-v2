import { exchangeGoogleCode, storeAccountGmailToken, storePersonalGmailToken } from "@/services/mail/gmail";
import { consumeOAuthPkceVerifier, consumeOAuthState, expiredOAuthPkceCookie, expiredOAuthStateCookie, getOAuthReturnTo } from "@/services/auth/oauthState";
import { requireCosmicAccount } from "@/services/auth/server";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const personal = resolvePrivateRequestContext(request, "private-personal");
  if (personal) {
    const verifier = consumeOAuthPkceVerifier(request, state);
    if (!consumeOAuthState(request, state, undefined, "google", "personal") || !verifier || !code) return Response.json({ error: "Invalid or expired personal Google OAuth state." }, { status: 400 });
    try {
      await storePersonalGmailToken(await exchangeGoogleCode(code, verifier));
      const returnTo = getOAuthReturnTo(request, state, undefined, "google", "personal") ?? "/gmail?connected=gmail";
      const headers = new Headers({ Location: new URL(returnTo, request.url).toString() });
      headers.append("Set-Cookie", expiredOAuthStateCookie());
      headers.append("Set-Cookie", expiredOAuthPkceCookie());
      return new Response(null, { status: 302, headers });
    } catch { return Response.json({ error: "Personal Gmail connection failed." }, { status: 502 }); }
  }
  let account;
  try { account = await requireCosmicAccount(request); }
  catch { return Response.json({ error: "Sign in before connecting Gmail." }, { status: 401 }); }
  if (!consumeOAuthState(request, state, account.id, "google", "legacy-account") || !code) return Response.json({ error: "Invalid or expired OAuth state." }, { status: 400 });
  try {
    await storeAccountGmailToken(account.id, await exchangeGoogleCode(code));
    const returnTo = getOAuthReturnTo(request, state, account.id, "google", "legacy-account") ?? "/gmail?connected=gmail";
    return new Response(null, { status: 302, headers: { Location: new URL(returnTo, request.url).toString(), "Set-Cookie": expiredOAuthStateCookie() } });
  } catch { return Response.json({ error: "Gmail connection failed." }, { status: 502 }); }
}
