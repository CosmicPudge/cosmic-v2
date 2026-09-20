export type SchoolScopeKind = "personal" | "local" | "account" | "device" | "dev";
export type SchoolSyncState = "local-only" | "synced" | "syncing" | "offline" | "error" | "conflict";

export interface SchoolSyncPresentation {
  label: string;
  detail: string;
  mode: "local" | "synced" | "pending" | "unavailable" | "conflict";
}

export function schoolSyncPresentation(
  scopeKind: SchoolScopeKind,
  state: SchoolSyncState,
  lastSyncedAt?: string,
): SchoolSyncPresentation {
  if (scopeKind !== "account") {
    return { label: "Saved locally", detail: "School data is stored in this browser.", mode: "local" };
  }

  switch (state) {
    case "synced": {
      const timestamp = lastSyncedAt ? new Date(lastSyncedAt) : null;
      const label = timestamp && Number.isFinite(timestamp.getTime())
        ? `Synced ${timestamp.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
        : "Synced";
      return { label, detail: "School data is synced to your account.", mode: "synced" };
    }
    case "syncing":
      return { label: "Syncing…", detail: "School data is being synced to your account.", mode: "pending" };
    case "conflict":
      return { label: "Sync conflict", detail: "A newer account copy needs to be reconciled.", mode: "conflict" };
    case "offline":
      return { label: "Offline", detail: "Changes remain saved in this browser until sync is available.", mode: "unavailable" };
    case "error":
      return { label: "Sync unavailable", detail: "Changes remain saved in this browser until sync is available.", mode: "unavailable" };
    case "local-only":
    default:
      return { label: "Saved locally", detail: "School data is stored in this browser.", mode: "local" };
  }
}

export function currentSchoolTermLabel<T extends { id: string; name: string; active?: boolean }>(terms: T[]): string {
  return terms.find((term) => term.active)?.name ?? terms[0]?.name ?? "No term selected";
}

export function canUseAccountCanvasControls(scopeKind: SchoolScopeKind): boolean {
  return scopeKind === "account";
}
