import { getGoogleAuthorizationUrl } from "@/services/mail/gmail";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { createOAuthState } from "@/services/auth/oauthState";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const account = await getCurrentCosmicAccount(request);
  if (!account) return Response.json({ error: "Sign in before connecting Gmail." }, { status: 401 });
  const state = createOAuthState(account.id);
  try { return new Response(null, { status: 302, headers: { Location: getGoogleAuthorizationUrl(state.state), "Set-Cookie": state.cookie } }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Gmail OAuth is unavailable." }, { status: 503 }); }
}
