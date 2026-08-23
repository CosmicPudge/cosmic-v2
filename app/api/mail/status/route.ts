import { canSendGmail, getGmailToken, isGmailConfigured } from "@/services/mail/gmail";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getServerGmailToken } from "@/core/serverCosmic";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const cosmicAccount = await getCurrentCosmicAccount(request); const token = cosmicAccount ? await getServerGmailToken(request) : getGmailToken(); const canSend = canSendGmail(token); return Response.json({ connected: Boolean(token), configured: isGmailConfigured(), provider: "gmail", canSend, reconnectRequired: Boolean(token) && !canSend, ...(cosmicAccount && token ? { account: "connected" } : {}) }); }
