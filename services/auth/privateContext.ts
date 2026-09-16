/**
 * A server-derived identity for future durable personal APIs. Personal is
 * deliberately not represented by an account-shaped object or an ID.
 */
export interface PersonalPrincipal {
  readonly kind: "personal";
}

export interface AccountPrincipal {
  readonly kind: "account";
  readonly accountId: string;
}

export interface DevicePrincipal {
  readonly kind: "device";
  readonly deviceId: string;
}

export type CosmicPrincipal = PersonalPrincipal | AccountPrincipal | DevicePrincipal;

export const PERSONAL_PRINCIPAL: PersonalPrincipal = Object.freeze({ kind: "personal" });

export type PrivateAccessPolicy =
  | "public-ui"
  | "private-personal"
  | "private-account"
  | "device"
  | "webhook"
  | "internal";

type RequestOrigin = "loopback-development" | "public-host";

export interface PrivateRequestContext {
  readonly principal: CosmicPrincipal;
  readonly policy: PrivateAccessPolicy;
  readonly mode: "personal" | "account" | "device";
  readonly origin: RequestOrigin;
}

function requestOrigin(request: Request): RequestOrigin {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const loopback = hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1";
  return process.env.NODE_ENV === "development" && loopback
    ? "loopback-development"
    : "public-host";
}

/**
 * Resolve only the new personal boundary. Account and device resolution stay
 * with their existing authentication services until their migration phases.
 */
export function resolvePrivateRequestContext(
  request: Request,
  policy: PrivateAccessPolicy,
): PrivateRequestContext | null {
  if (policy !== "private-personal") return null;
  if (requestOrigin(request) !== "loopback-development") return null;

  return {
    principal: PERSONAL_PRINCIPAL,
    policy,
    mode: "personal",
    origin: "loopback-development",
  };
}

export function requirePrivateRequestContext(
  request: Request,
  policy: PrivateAccessPolicy,
): PrivateRequestContext {
  const context = resolvePrivateRequestContext(request, policy);
  if (!context) throw new Response("Private access unavailable.", { status: 401 });
  return context;
}
