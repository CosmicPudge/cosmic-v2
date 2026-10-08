import { createPasswordReset, normalizeEmail } from "@/services/auth/service";
import { isPasswordRecoveryEmailConfigured, sendPasswordResetEmail } from "@/services/auth/recoveryEmail";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const message = "If an active account matches that email, recovery instructions have been sent.";
  try {
    const token = await createPasswordReset(email);
    const response: { message: string; resetUrl?: string; delivery?: "email" | "local" | "unavailable" } = { message };
    if (!token) return Response.json(response, { headers: { "Cache-Control": "no-store" } });

    const resetUrl = new URL(`/activate/recover?token=${encodeURIComponent(token)}`, request.url).toString();
    if (process.env.NODE_ENV !== "production") {
      response.resetUrl = resetUrl;
      response.delivery = "local";
      return Response.json(response, { headers: { "Cache-Control": "no-store" } });
    }

    if (!isPasswordRecoveryEmailConfigured()) {
      console.error("[auth] password reset requested but recovery email is not configured");
      response.delivery = "unavailable";
      return Response.json(response, { headers: { "Cache-Control": "no-store" } });
    }

    await sendPasswordResetEmail({ to: email, resetUrl });
    response.delivery = "email";
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[auth] password reset delivery failed", error instanceof Error ? error.message : "unknown-error");
    return Response.json({ message }, { headers: { "Cache-Control": "no-store" } });
  }
}
