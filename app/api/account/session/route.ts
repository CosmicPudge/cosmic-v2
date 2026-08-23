import { getSession } from "@/services/auth/service";
import { checkDatabase } from "@/services/database/client";
import { getAuthRepositoryMode } from "@/services/auth/repository";
import { isAdminAccount } from "@/services/admin/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    return Response.json({ repositoryMode: getAuthRepositoryMode(), database: await checkDatabase(), ...(session ? { authenticated: true, isAdmin: await isAdminAccount(session.account.id), ...session } : { authenticated: false, isAdmin: false }) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Account session service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
