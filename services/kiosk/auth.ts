import "server-only";

import { getCurrentCosmicSession, kioskBootId } from "@/services/auth/server";
import { isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";

type KioskSession = NonNullable<Awaited<ReturnType<typeof getCurrentCosmicSession>>>;

export type DeveloperKioskSessionResult =
  | { status: "not-found" }
  | { status: "unavailable" }
  | { status: "unauthorized" }
  | { status: "authenticated"; session: KioskSession };

export async function getDeveloperKioskSession(request: Request): Promise<DeveloperKioskSessionResult> {
  if (!isDeveloperKioskRequest(request)) return { status: "not-found" };
  try {
    const session = await getCurrentCosmicSession(request, { allowUser: false, allowDevice: true, bootId: kioskBootId(request) });
    return session ? { status: "authenticated", session } : { status: "unauthorized" };
  } catch {
    return { status: "unavailable" };
  }
}
