import "server-only";

import {
  resolveDurableOwner,
  resolvePersonalOwner,
  type DurableOwner,
  type PersonalOwner,
} from "@/services/ownership/owner";
import type { CosmicPrincipal } from "./privateContext";

/** Server-only entry point for request authorization to durable ownership. */
export function resolvePersonalOwnerForPrincipal(principal: CosmicPrincipal): PersonalOwner | null {
  return resolvePersonalOwner(principal);
}

export function resolveDurableOwnerForPrincipal(principal: CosmicPrincipal): DurableOwner | null {
  return resolveDurableOwner(principal);
}
