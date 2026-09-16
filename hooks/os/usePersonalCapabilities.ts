"use client";

import { freeEntitlements } from "@/core/contracts/Entitlements";

/**
 * Capabilities for local-first personal surfaces. This intentionally has no
 * account, session, billing, or network readiness dependency.
 */
export function usePersonalCapabilities() {
  return freeEntitlements;
}
