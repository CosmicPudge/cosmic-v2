import { NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin/auth";
import { getObservabilitySnapshot } from "@/services/observability/metrics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json(getObservabilitySnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Performance diagnostics unavailable." }, { status: 503 });
  }
}
