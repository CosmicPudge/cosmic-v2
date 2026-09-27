import { completePasswordReset } from "@/services/auth/service";
import { authErrorResponse } from "@/services/auth/http";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: unknown; password?: unknown } | null;
  if (typeof body?.token !== "string" || typeof body.password !== "string") return Response.json({ error: "Reset token and a new password are required." }, { status: 400 });
  try { await completePasswordReset(body.token, body.password); return Response.json({ message: "Password updated. You can sign in with your new password." }); }
  catch (error) { return authErrorResponse(error, "Password could not be updated.", 400); }
}
