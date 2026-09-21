import type { SchoolAccessContext } from "./access";
import { requireSchoolAccessContext } from "./access";

export type SchoolPagePresentation = "personal-local" | "account";

export function shouldLoadAccountBackedSchoolData(scopeKind: string): boolean {
  return scopeKind === "account";
}

/**
 * Page-shell presentation is separate from server data authorization. An
 * anonymous visitor gets the browser-local School UI without account lookup;
 * a presented session cookie must still pass the existing School access gate.
 */
export async function requireSchoolPagePresentation(
  request: Request,
  hasSessionCookie: boolean,
  resolveAccess: (request: Request) => Promise<SchoolAccessContext> = requireSchoolAccessContext,
): Promise<SchoolPagePresentation> {
  if (!hasSessionCookie) return "personal-local";
  try {
    const access = await resolveAccess(request);
    return access.request.mode === "account" ? "account" : "personal-local";
  } catch (error) {
    // An expired/revoked cookie is anonymous, not an authorization denial.
    // Valid but non-owner accounts (403) and infrastructure errors still fail closed.
    if (error instanceof Response && error.status === 401) return "personal-local";
    throw error;
  }
}
