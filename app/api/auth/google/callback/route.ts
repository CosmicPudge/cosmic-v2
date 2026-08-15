import { consumeGoogleState } from "../route";
import { exchangeGoogleCode, storeGmailToken } from "@/services/mail/gmail";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const url = new URL(request.url); if (!consumeGoogleState(url.searchParams.get("state")) || !url.searchParams.get("code")) return Response.json({ error: "Invalid or expired OAuth state." }, { status: 400 }); try { storeGmailToken(await exchangeGoogleCode(url.searchParams.get("code")!)); return Response.redirect(new URL("/gmail?connected=gmail", request.url), 302); } catch { return Response.json({ error: "Gmail connection failed." }, { status: 502 }); } }
