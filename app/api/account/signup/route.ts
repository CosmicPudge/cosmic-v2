import { createAccount, createSession } from "@/services/auth/service";
import { sessionCookie } from "@/services/auth/localStore";
import { authErrorResponse } from "@/services/auth/http";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown; displayName?: unknown } | null;
    if (!body || typeof body.email !== "string" || typeof body.password !== "string" || (body.displayName !== undefined && typeof body.displayName !== "string")) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }
    const account = await createAccount({
      email: body.email,
      password: body.password,
      ...(typeof body.displayName === "string" ? { displayName: body.displayName } : {}),
    });
    const session = await createSession(account.id, request.headers.get("user-agent") ?? undefined);
    return Response.json({ account, expiresAt: session.expiresAt }, {
      status: 201,
      headers: { "Set-Cookie": sessionCookie(session.token, session.expiresAt) },
    });
  } catch (error) {
    return authErrorResponse(error, "Account creation failed.", 400);
  }
}
