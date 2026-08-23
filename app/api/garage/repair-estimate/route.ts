import { NextResponse } from "next/server";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getAccountEntitlements } from "@/services/entitlements/service";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  assertSameOrigin(request);
  const account = await getCurrentCosmicAccount(request);
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const entitlements = await getAccountEntitlements(account.id);
  if (!entitlements.features["garage.advanced"]) return NextResponse.json({ error: "Repair intelligence is included with Cosmic+. You can continue manually." }, { status: 403 });
  await request.json().catch(() => null);
  return NextResponse.json({ error: "No licensed repair-estimate provider is configured. Record a manual quote or service instead." }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
