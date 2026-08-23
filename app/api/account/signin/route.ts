import { authenticateAccount, createSession } from "@/services/auth/service";
import { sessionCookie } from "@/services/auth/localStore";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const account = await authenticateAccount(body.email ?? "", body.password ?? "");
    const session = await createSession(account.id, request.headers.get("user-agent") ?? undefined);
    return Response.json({ account, expiresAt: session.expiresAt }, { headers: { "Set-Cookie": sessionCookie(session.token, session.expiresAt) } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Sign in failed." }, { status: 401 }); }
}
