import { destroySession } from "@/services/auth/service";
import { expiredSessionCookie } from "@/services/auth/localStore";

export async function POST(request: Request) {
  await destroySession(request);
  return Response.json({ ok: true }, { headers: { "Set-Cookie": expiredSessionCookie() } });
}
