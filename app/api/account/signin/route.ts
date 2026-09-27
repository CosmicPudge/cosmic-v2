import { authenticateAccount, createSession } from "@/services/auth/service";
import { sessionCookie } from "@/services/auth/localStore";
import { authErrorResponse } from "@/services/auth/http";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const account = await authenticateAccount(body.email ?? "", body.password ?? "");
    const session = await createSession(account.id, request.headers.get("user-agent") ?? undefined);
    return Response.json({ account, expiresAt: session.expiresAt }, { headers: { "Set-Cookie": sessionCookie(session.token, session.expiresAt) } });
  } catch (error) { return authErrorResponse(error, "Sign in failed.", 401); }
}
