import { requireCosmicAccount } from "@/services/auth/server";
import { isDatabaseConfigured } from "@/services/database/client";
import { readCloudSnapshot, writeCloudSnapshot } from "@/services/sync/repository";
import { validateFinanceSync, validateGarageSync, validateNotesSync, validateProjectsSync, validateSchoolSync, validateSettingsSync } from "@/services/sync/validation";
import type { CosmicSyncDomain } from "@/services/sync/contracts";
import { assertFinanceSnapshotWriteAllowed } from "@/services/sync/entitlementValidation";
import { assertSameOrigin } from "@/services/security/origin";
import { requireSchoolAccess } from "@/services/school/access";

export const dynamic = "force-dynamic";
const domains: CosmicSyncDomain[] = ["settings", "notes", "projects", "finance", "garage", "school"];
function domainFrom(params: { domain: string }) { return domains.includes(params.domain as CosmicSyncDomain) ? params.domain as CosmicSyncDomain : null; }
function validator(domain: CosmicSyncDomain) { if (domain === "settings") return validateSettingsSync; if (domain === "notes") return validateNotesSync; if (domain === "projects") return validateProjectsSync; if (domain === "finance") return validateFinanceSync; if (domain === "garage") return validateGarageSync; return validateSchoolSync; }

export async function GET(request: Request, context: { params: Promise<{ domain: string }> }) {
  const domain = domainFrom(await context.params); if (!domain) return Response.json({ error: "Unknown sync domain." }, { status: 404 });
  const account = domain === "school" ? await requireSchoolAccess(request) : await requireCosmicAccount(request); if (!isDatabaseConfigured()) return Response.json({ error: "Cloud sync requires DATABASE_URL." }, { status: 503 });
  try { const current = await readCloudSnapshot(account.id, domain); return current ? Response.json({ ...current, initialized: true }, { headers: { "Cache-Control": "no-store" } }) : Response.json({ snapshot: null, revision: 0, initialized: false }, { headers: { "Cache-Control": "no-store" } }); } catch { return Response.json({ error: "Cloud sync is unavailable." }, { status: 503 }); }
}

export async function PUT(request: Request, context: { params: Promise<{ domain: string }> }) {
  try { assertSameOrigin(request); const domain = domainFrom(await context.params); if (!domain) return Response.json({ error: "Unknown sync domain." }, { status: 404 }); const account = domain === "school" ? await requireSchoolAccess(request) : await requireCosmicAccount(request); if (!isDatabaseConfigured()) return Response.json({ error: "Cloud sync requires DATABASE_URL." }, { status: 503 }); const body = await request.json() as { snapshot?: unknown; expectedRevision?: unknown }; if (typeof body.expectedRevision !== "number" || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0 || !validator(domain)(body.snapshot)) return Response.json({ error: "Invalid sync payload." }, { status: 400 }); if (domain === "finance") { const current = await readCloudSnapshot(account.id, domain); await assertFinanceSnapshotWriteAllowed(account.id, body.snapshot, current?.snapshot); } const result = await writeCloudSnapshot(account.id, domain, body.snapshot, body.expectedRevision); if ("conflict" in result) return Response.json({ error: "A newer cloud revision exists.", snapshot: result.snapshot, revision: result.revision }, { status: 409 }); return Response.json({ revision: result.revision }); } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Cloud sync is unavailable." }, { status: 503 }); }
}
