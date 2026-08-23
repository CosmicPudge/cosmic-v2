import "server-only";

import type { CosmicAccount } from "@/core/contracts/Account";
import { getSession } from "./service";

export async function getCurrentCosmicAccount(request: Request): Promise<CosmicAccount | null> {
  return (await getSession(request))?.account ?? null;
}

export async function requireCosmicAccount(request: Request): Promise<CosmicAccount> {
  const account = await getCurrentCosmicAccount(request);
  if (!account) throw new Response("Authentication required.", { status: 401 });
  return account;
}
