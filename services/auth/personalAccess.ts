export type PersonalAccessAssertion =
  | { readonly kind: "development-loopback-personal" }
  | { readonly kind: "verified-hosted-personal"; readonly source: "trusted-ingress" }
  | { readonly kind: "untrusted-public-request"; readonly reason: "no-verified-ingress" | "malformed-assertion" };

/**
 * This is deliberately design-only in 3B5A. A public request cannot become
 * personal based on its hostname or on an identity-shaped header.
 */
export function resolvePersonalAccessAssertion(request: Request): PersonalAccessAssertion {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const loopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (process.env.NODE_ENV === "development" && loopback) {
    return { kind: "development-loopback-personal" };
  }
  return { kind: "untrusted-public-request", reason: "no-verified-ingress" };
}

/**
 * Future ingress adapters may return this only after cryptographic or
 * platform-verified authentication. No adapter is installed in this phase.
 */
export function resolveVerifiedHostedPersonalAssertion(request: Request): Extract<PersonalAccessAssertion, { kind: "verified-hosted-personal" }> | null {
  void request;
  return null;
}
