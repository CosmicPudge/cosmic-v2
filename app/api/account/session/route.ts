import { getSession } from "@/services/auth/service";
import { checkDatabase } from "@/services/database/client";
import { getAuthRepositoryMode } from "@/services/auth/repository";
import { isAdminAccount } from "@/services/admin/auth";
import { expiredSessionCookie } from "@/services/auth/localStore";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const kioskRequest = searchParams.get("cosmic-kiosk") === "1";
    const bootId = kioskRequest ? searchParams.get("cosmic-boot") ?? "" : undefined;
    const session = await getSession(request, bootId);
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (kioskRequest && !session) headers.set("Set-Cookie", expiredSessionCookie());
    return Response.json({ repositoryMode: getAuthRepositoryMode(), database: await checkDatabase(), ...(session ? { authenticated: true, isAdmin: await isAdminAccount(session.account.id), ...session } : { authenticated: false, isAdmin: false }) }, { headers });
  } catch {
    return Response.json({ error: "Account session service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
