import { getCurrentCosmicAccount } from "@/services/auth/server";
import { createOAuthState } from "@/services/auth/oauthState";
import { getMicrosoftIdentityAuthorizationUrl, isOutlookConfigured } from "@/services/mail/outlook";

export const dynamic = "force-dynamic";
export async function GET(request: Request) { if (!isOutlookConfigured()) return Response.json({ error: "Microsoft sign-in is not configured." }, { status: 503 }); const account = await getCurrentCosmicAccount(request); const url = new URL(request.url); const state = createOAuthState(account?.id, url.searchParams.get("returnTo") ?? "/account", "microsoft"); return new Response(null, { status: 302, headers: { Location: getMicrosoftIdentityAuthorizationUrl(state.state), "Set-Cookie": state.cookie } }); }
