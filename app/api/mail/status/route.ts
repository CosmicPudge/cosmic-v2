import { canSendGmail, getGmailToken, isGmailConfigured } from "@/services/mail/gmail";
export const dynamic = "force-dynamic";
export async function GET() { const account = process.env.GOOGLE_GMAIL_ACCOUNT_ID; const token = getGmailToken(); const canSend = canSendGmail(token); return Response.json({ connected: Boolean(token), configured: isGmailConfigured(), provider: "gmail", canSend, reconnectRequired: Boolean(token) && !canSend, ...(account ? { account: account.replace(/^(.{3}).*(@.*)$/, "$1*****$2") } : {}) }); }
