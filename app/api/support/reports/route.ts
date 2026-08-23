import { NextResponse } from "next/server";
import { supportModules, type SupportReportType, type SupportSeverity } from "@/core/contracts/Support";
import { requireCosmicAccount } from "@/services/auth/server";
import { getAccountEntitlements } from "@/services/entitlements/service";
import { assertSameOrigin } from "@/services/security/origin";
import { createPublicReference, createSupportReport, listUserReports } from "@/services/support/repository";
import { redactSensitiveText, safeErrorSummary } from "@/services/support/redaction";
import { randomUUID } from "node:crypto";

const types = ["bug", "feature", "feedback"] as const;
const severities = ["cosmetic", "annoying", "broken", "unusable"] as const;
const max = (value: unknown, length: number) => typeof value === "string" ? value.trim().slice(0, length) : "";
function valid<T extends readonly string[]>(value: unknown, choices: T): value is T[number] { return typeof value === "string" && choices.includes(value); }

export async function GET(request: Request) { try { const account = await requireCosmicAccount(request); return NextResponse.json({ reports: await listUserReports(account.id) }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Reports unavailable." }, { status: 503 }); } }

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireCosmicAccount(request); const body = await request.json() as Record<string, unknown>;
    const type = body.type; const moduleName = body.module; const severity = body.severity;
    if (!valid(type, types) || !valid(moduleName, supportModules) || (severity && !valid(severity, severities))) return NextResponse.json({ error: "Choose a valid report type, module, and severity." }, { status: 400 });
    const title = max(body.title, 160); const description = max(body.description, 5000); if (!title || !description) return NextResponse.json({ error: "A title and description are required." }, { status: 400 });
    const url = new URL(request.url); const headerRoute = request.headers.get("x-cosmic-route"); const viewport = max(request.headers.get("x-cosmic-viewport"), 40); const entitlements = await getAccountEntitlements(account.id);
    const diagnostics = { route: redactSensitiveText(headerRoute || url.pathname, 200), version: redactSensitiveText(process.env.NEXT_PUBLIC_COSMIC_VERSION ?? "0.1.0", 50), environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown", browser: redactSensitiveText(request.headers.get("user-agent"), 240), ...(viewport ? { viewport } : {}), signedIn: true, accountId: account.id, effectivePlan: entitlements.plan, timestamp: new Date().toISOString(), module: moduleName, ...(body.errorSummary ? { errorSummary: safeErrorSummary(body.errorSummary) } : {}) };
    const report = await createSupportReport({ id: `support_${randomUUID()}`, publicReference: createPublicReference(), accountId: account.id, type: type as SupportReportType, module: moduleName, severity: type === "bug" ? (severity as SupportSeverity ?? null) : null, title, description, expectedBehavior: max(body.expectedBehavior, 3000) || null, reproductionSteps: max(body.reproductionSteps, 3000) || null, notes: max(body.notes, 3000) || null, diagnostics, attachmentRef: null });
    return NextResponse.json({ report: { id: report.id, publicReference: report.publicReference, status: report.status } }, { status: 201 });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Report could not be submitted." }, { status: 503 }); }
}
