import type { CosmicPlan } from "@/core/contracts/Entitlements";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { clearDevelopmentEntitlement, getAccountBillingPlan, getAccountEntitlements, getDevelopmentEntitlement, setDevelopmentEntitlement } from "@/services/entitlements/service";

function isPlan(value: unknown): value is CosmicPlan { return value === "free" || value === "cosmic_plus"; }

async function diagnostics(accountId: string) {
  const entitlements = await getAccountEntitlements(accountId);
  return { account: accountId, billingPlan: await getAccountBillingPlan(accountId), developmentOverride: getDevelopmentEntitlement(accountId) ?? null, effectivePlan: entitlements.plan, entitlements };
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Development tools are unavailable in production." }, { status: 404 });
  const account = await getCurrentCosmicAccount(request);
  if (!account) return Response.json({ error: "Sign in to inspect account entitlements." }, { status: 401 });
  return Response.json(await diagnostics(account.id), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Development tools are unavailable in production." }, { status: 404 });
  const account = await getCurrentCosmicAccount(request);
  if (!account) return Response.json({ error: "Sign in to change development entitlements." }, { status: 401 });
  const body = await request.json().catch(() => null) as { plan?: unknown } | null;
  if (!body || !isPlan(body.plan)) return Response.json({ error: "Choose free or cosmic_plus." }, { status: 400 });
  setDevelopmentEntitlement(account.id, body.plan);
  return Response.json(await diagnostics(account.id), { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Development tools are unavailable in production." }, { status: 404 });
  const account = await getCurrentCosmicAccount(request);
  if (!account) return Response.json({ error: "Sign in to reset development entitlements." }, { status: 401 });
  clearDevelopmentEntitlement(account.id);
  return Response.json(await diagnostics(account.id), { headers: { "Cache-Control": "no-store" } });
}
