import { canSendGmail, getGmailToken, getPersonalGmailToken, isGmailConfigured } from "@/services/mail/gmail";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getServerGmailToken } from "@/core/serverCosmic";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const personal = resolvePrivateRequestContext(request, "private-personal");
  if (personal) {
    try {
      const token = await getPersonalGmailToken();
      const canSend = canSendGmail(token);
      return Response.json({ connected: Boolean(token), configured: isGmailConfigured(), provider: "gmail", canSend, reconnectRequired: Boolean(token) && !canSend });
    } catch { return Response.json({ connected: false, configured: isGmailConfigured(), provider: "gmail", canSend: false, reconnectRequired: false, status: "unavailable" }); }
  }
  const cosmicAccount = await getCurrentCosmicAccount(request);
  const token = cosmicAccount ? await getServerGmailToken(request) : getGmailToken();
  const canSend = canSendGmail(token);
  return Response.json({ connected: Boolean(token), configured: isGmailConfigured(), provider: "gmail", canSend, reconnectRequired: Boolean(token) && !canSend, ...(cosmicAccount && token ? { account: "connected" } : {}) });
}
