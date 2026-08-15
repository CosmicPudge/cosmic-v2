import { getServerMailEngine } from "@/core/serverCosmic";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { const engine = getServerMailEngine(); if (!engine) return Response.json({ error: "Gmail is not connected." }, { status: 401 }); try { return Response.json({ message: await engine.getMessage((await params).id) }); } catch { return Response.json({ error: "Message is unavailable." }, { status: 404 }); } }
