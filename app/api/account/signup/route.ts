import { createAccount, createSession } from "@/services/auth/service";
import { sessionCookie } from "@/services/auth/localStore";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string; displayName?: string };
    const account = await createAccount({ email: body.email ?? "", password: body.password ?? "", displayName: body.displayName });
    const session = await createSession(account.id, request.headers.get("user-agent") ?? undefined);
    return Response.json({ account, expiresAt: session.expiresAt }, { headers: { "Set-Cookie": sessionCookie(session.token, session.expiresAt) } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Account creation failed." }, { status: 400 }); }
}
