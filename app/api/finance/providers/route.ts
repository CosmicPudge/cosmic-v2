import { requireCosmicAccount } from "@/services/auth/server";
import { getFinancialProviderRegistry, publicProviderDescriptor, searchFinancialInstitutions } from "@/services/finance/providers/registry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireCosmicAccount(request);
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (query) return Response.json({ query, results: await searchFinancialInstitutions(query) });
    return Response.json({ providers: getFinancialProviderRegistry().map(publicProviderDescriptor) });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Provider discovery is unavailable." }, { status: 503 }); }
}
