import { isAppleIdentityConfigured } from "@/services/auth/identityProviders";

export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ error: isAppleIdentityConfigured() ? "Sign in with Apple is not enabled yet." : "Sign in with Apple is not configured." }, { status: isAppleIdentityConfigured() ? 501 : 503 }); }
