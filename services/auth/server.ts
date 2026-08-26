import "server-only";

import type { CosmicAccount } from "@/core/contracts/Account";
import { getSession } from "./service";

export interface AuthenticatedSessionOptions {
  allowUser?: boolean;
  allowDevice?: boolean;
  bootId?: string;
}

export function kioskBootId(request: Request): string | undefined {
  const url = new URL(request.url);
  if (url.searchParams.get("cosmic-kiosk") !== "1") return undefined;
  const bootId = url.searchParams.get("cosmic-boot")?.trim();
  return bootId || undefined;
}

export async function getCurrentCosmicSession(
  request: Request,
  options: AuthenticatedSessionOptions = {},
) {
  const session = await getSession(request, options.bootId);
  const allowUser = options.allowUser ?? true;
  const allowDevice = options.allowDevice ?? false;
  if (!session || (session.sessionType === "user" && !allowUser) || (session.sessionType === "device" && !allowDevice)) {
    return null;
  }
  return session;
}

export async function requireAuthenticatedSession(
  request: Request,
  options: AuthenticatedSessionOptions = {},
) {
  const session = await getCurrentCosmicSession(request, options);
  if (!session) throw new Response("Authentication required.", { status: 401 });
  return session;
}

export async function getCurrentCosmicAccount(
  request: Request,
  options: AuthenticatedSessionOptions = {},
): Promise<CosmicAccount | null> {
  return (await getCurrentCosmicSession(request, options))?.account ?? null;
}

export async function requireCosmicAccount(request: Request): Promise<CosmicAccount> {
  return (await requireAuthenticatedSession(request)).account;
}
