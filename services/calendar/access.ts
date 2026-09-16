import type { CosmicPrincipal, PrivateRequestContext } from "@/services/auth/privateContext";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";
import { resolveDurableOwner, type DurableOwner } from "@/services/ownership/owner";

export type CalendarStorageOwner = DurableOwner | { readonly kind: "unavailable"; readonly reason: "unauthorized" | "device-not-owner" };

export interface CalendarAccessContext {
  readonly principal: CosmicPrincipal;
  readonly request: PrivateRequestContext;
  readonly storageOwner: CalendarStorageOwner;
}

export function personalCalendarAccessContext(request: Request): CalendarAccessContext | null {
  const context = resolvePrivateRequestContext(request, "private-personal");
  if (!context) return null;
  return { principal: context.principal, request: context, storageOwner: resolveDurableOwner(context.principal)! };
}

export async function resolveCalendarAccessContext(request: Request): Promise<CalendarAccessContext> {
  const personal = personalCalendarAccessContext(request);
  if (personal) return personal;
  const { getCurrentCosmicSession } = await import("@/services/auth/server");
  const session = await getCurrentCosmicSession(request, { allowDevice: true });
  if (!session) throw new Response("Authentication required.", { status: 401 });
  const principal: CosmicPrincipal = session.sessionType === "device" && session.deviceId
    ? { kind: "device", deviceId: session.deviceId }
    : { kind: "account", accountId: session.account.id };
  return {
    principal,
    request: { principal, policy: session.sessionType === "device" ? "device" : "private-account", mode: session.sessionType === "device" ? "device" : "account", origin: "public-host" },
    storageOwner: resolveDurableOwner(principal) ?? { kind: "unavailable", reason: "device-not-owner" },
  };
}
