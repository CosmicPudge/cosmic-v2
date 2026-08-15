import { getServerMailEngine } from "@/core/serverCosmic";
import { sendGmailReply } from "@/services/mail/gmail";
export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const engine = getServerMailEngine(); if (!engine) return Response.json({ error: "Gmail is not connected." }, { status: 401 }); try { const { bodyText } = await request.json() as { bodyText?: string }; const original = await engine.getMessage((await params).id); const message = await sendGmailReply(original, bodyText ?? ""); return Response.json({ success: true, message }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Reply could not be sent." }, { status: 400 }); } }
