import { isAppleIdentityConfigured } from "@/services/auth/identityProviders";

export const dynamic = "force-dynamic";
export async function GET() { if (!isAppleIdentityConfigured()) return Response.json({ error: "Sign in with Apple is not configured." }, { status: 503 }); return Response.json({ error: "Sign in with Apple is not enabled yet." }, { status: 501 }); }
