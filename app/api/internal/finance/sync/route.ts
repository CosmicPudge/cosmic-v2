import { processFinanceSyncBatch } from "@/services/finance/syncProcessor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) { const secret = process.env.CRON_SECRET; return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`; }

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  try { return Response.json(await processFinanceSyncBatch(3)); } catch { return Response.json({ error: "Finance sync processor unavailable." }, { status: 503 }); }
}
