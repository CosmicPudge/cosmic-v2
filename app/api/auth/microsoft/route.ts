import { getCurrentCosmicAccount } from "@/services/auth/server";
import { createOAuthState } from "@/services/auth/oauthState";
import { getOutlookAuthorizationUrl } from "@/services/mail/outlook";

export const dynamic = "force-dynamic";
export async function GET(request: Request) { const account = await getCurrentCosmicAccount(request); if (!account) return Response.json({ error: "Sign in before connecting Outlook." }, { status: 401 }); const state = createOAuthState(account.id, new URL(request.url).searchParams.get("returnTo") ?? undefined); try { return new Response(null, { status: 302, headers: { Location: getOutlookAuthorizationUrl(state.state), "Set-Cookie": state.cookie } }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Outlook OAuth is unavailable." }, { status: 503 }); } }
