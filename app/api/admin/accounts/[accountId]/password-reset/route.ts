import { randomBytes, randomUUID } from "node:crypto";
import { requireAdmin } from "@/services/admin/auth";
import { hashSessionToken } from "@/services/auth/localStore";
import { getAuthRepository } from "@/services/auth/repository";
import { getAdminAccount, recordAudit, revokeAllSessions } from "@/services/admin/repository";

export async function POST(request: Request, context: { params: Promise<{ accountId: string }> }) {
  try {
    const actor = await requireAdmin(request); const { accountId } = await context.params;
    const account = await getAdminAccount(accountId); if (!account) return Response.json({ error: "Account not found." }, { status: 404 });
    const body = await request.json().catch(() => null) as { reason?: unknown } | null;
    const token = randomBytes(32).toString("base64url");
    await getAuthRepository().createPasswordResetToken({ id: `password_reset_${randomUUID()}`, userId: accountId, tokenHash: hashSessionToken(token), expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() });
    await revokeAllSessions(accountId);
    await recordAudit(actor.id, accountId, "password.force_reset", { reason: typeof body?.reason === "string" ? body.reason.slice(0, 300) : null });
    return Response.json({ resetUrl: new URL(`/activate/recover?token=${encodeURIComponent(token)}`, request.url).toString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Password reset could not be issued." }, { status: 503 }); }
}
