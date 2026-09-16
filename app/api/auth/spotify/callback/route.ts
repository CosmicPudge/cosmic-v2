import { exchange, storeAccountToken, storePersonalSpotifyToken } from "@/services/music/spotify";
import { consumeOAuthPkceVerifier, consumeOAuthState, expiredOAuthPkceCookie, expiredOAuthStateCookie, getOAuthReturnTo } from "@/services/auth/oauthState";
import { requireCosmicAccount } from "@/services/auth/server";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (resolvePrivateRequestContext(request, "private-personal")) {
    const verifier = consumeOAuthPkceVerifier(request, state);
    if (!consumeOAuthState(request, state, undefined, "spotify", "personal") || !verifier || !code) return Response.json({ error: "Invalid or expired personal Spotify OAuth state." }, { status: 400 });
    try {
      await storePersonalSpotifyToken(await exchange(code, verifier));
      const returnTo = getOAuthReturnTo(request, state, undefined, "spotify", "personal") ?? "/music?connected=spotify";
      const headers = new Headers({ Location: new URL(returnTo, request.url).toString() });
      headers.append("Set-Cookie", expiredOAuthStateCookie());
      headers.append("Set-Cookie", expiredOAuthPkceCookie());
      return new Response(null, { status: 302, headers });
    } catch { return Response.json({ error: "Personal Spotify connection failed." }, { status: 502 }); }
  }
  let account;
  try { account = await requireCosmicAccount(request); }
  catch { return Response.json({ error: "Sign in before connecting Spotify." }, { status: 401 }); }
  if (!consumeOAuthState(request, state, account.id, "spotify", "legacy-account") || !code) return Response.json({ error: "Invalid Spotify OAuth state." }, { status: 400 });
  try {
    await storeAccountToken(account.id, await exchange(code));
    const returnTo = getOAuthReturnTo(request, state, account.id, "spotify", "legacy-account") ?? "/music?connected=spotify";
    return new Response(null, { status: 302, headers: { Location: new URL(returnTo, request.url).toString(), "Set-Cookie": expiredOAuthStateCookie() } });
  } catch { return Response.json({ error: "Spotify connection failed." }, { status: 502 }); }
}
