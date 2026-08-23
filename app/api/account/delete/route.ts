import { requireCosmicAccount } from "@/services/auth/server";
import { cancelSubscriptionForAccountDeletion } from "@/services/billing/stripe";
import { getAuthRepository } from "@/services/auth/repository";
import { expiredSessionCookie } from "@/services/auth/localStore";

export async function DELETE(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    const body = await request.json().catch(() => ({})) as { confirmation?: unknown };
    if (body.confirmation !== "DELETE") return Response.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
    await cancelSubscriptionForAccountDeletion(account);
    const repository = getAuthRepository();
    await repository.revokeAllSessions(account.id);
    await repository.deleteUser(account.id);
    return new Response(null, { status: 204, headers: { "Set-Cookie": expiredSessionCookie() } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "Account deletion is unavailable." }, { status: 409 });
  }
}
