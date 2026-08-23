import { NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin/auth";
import { assertSameOrigin } from "@/services/security/origin";
import { clearModeration, getAdminAccount, recordAudit } from "@/services/admin/repository";
export async function POST(request: Request, context: { params: Promise<{ accountId: string }> }) { try { assertSameOrigin(request); const actor = await requireAdmin(request); const { accountId } = await context.params; if (!(await getAdminAccount(accountId))) return NextResponse.json({ error: "Account not found." }, { status: 404 }); await clearModeration(accountId); await recordAudit(actor.id, accountId, "account.unban", {}); return NextResponse.json(await getAdminAccount(accountId), { headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Account restoration unavailable." }, { status: 503 }); } }
