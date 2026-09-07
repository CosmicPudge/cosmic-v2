import { runSportsPushCycle } from "@/services/sports/pushCycle";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) { const secret = process.env.CRON_SECRET; return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`; }

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  try { return Response.json(await runSportsPushCycle()); } catch { return Response.json({ error: "Sports push cycle unavailable." }, { status: 503 }); }
}
