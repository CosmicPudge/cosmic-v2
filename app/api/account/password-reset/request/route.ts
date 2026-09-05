import { createPasswordReset } from "@/services/auth/service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  try {
    const token = await createPasswordReset(email);
    const response: { message: string; resetUrl?: string } = { message: "If an active account matches that email, recovery instructions are ready." };
    if (token && process.env.NODE_ENV !== "production") response.resetUrl = new URL(`/activate/recover?token=${encodeURIComponent(token)}`, request.url).toString();
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "If an active account matches that email, recovery instructions are ready." }, { headers: { "Cache-Control": "no-store" } });
  }
}
