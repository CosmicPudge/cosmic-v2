import { NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin/auth";
import { assertSameOrigin } from "@/services/security/origin";
import { getAdminAccount, recordAudit, revokeAllSessions } from "@/services/admin/repository";
export async function POST(request: Request, context: { params: Promise<{ accountId: string }> }) { try { assertSameOrigin(request); const actor = await requireAdmin(request); const { accountId } = await context.params; if (!(await getAdminAccount(accountId))) return NextResponse.json({ error: "Account not found." }, { status: 404 }); await revokeAllSessions(accountId); await recordAudit(actor.id, accountId, "session.revoke_all", {}); return NextResponse.json({ ok: true }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Session revocation unavailable." }, { status: 503 }); } }
