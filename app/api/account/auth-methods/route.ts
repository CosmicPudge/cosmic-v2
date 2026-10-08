import { isAppleIdentityConfigured, isGoogleIdentityConfigured, isMicrosoftIdentityConfigured } from "@/services/auth/identityProviders";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    password: true,
    google: isGoogleIdentityConfigured(),
    microsoft: isMicrosoftIdentityConfigured(),
    apple: isAppleIdentityConfigured(),
  }, { headers: { "Cache-Control": "no-store" } });
}
