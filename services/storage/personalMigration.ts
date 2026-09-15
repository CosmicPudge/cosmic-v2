import { PERSONAL_COSMIC_APPLICATION } from "@/core/contracts/Application";

export const PERSONAL_MIGRATION_VERSION = 1;
export const PERSONAL_MIGRATION_MARKER_KEY = "cosmic.personalMigration.version";
export const PERSONAL_SCOPE_ID = PERSONAL_COSMIC_APPLICATION.scope.id;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  key(index: number): string | null;
  readonly length: number;
}

export const PERSONAL_DOMAINS = [
  "settings", "finance", "sports", "garage", "notes", "projects", "school",
  "search", "clock", "notifications", "weather-location", "school-note-spelling", "afrotc-cadet-category",
] as const;

export type PersonalDomain = typeof PERSONAL_DOMAINS[number];
export type PersonalMigrationStatus = "absent" | "ready" | "destination-present" | "equivalent" | "conflict" | "ambiguous" | "account-source-only" | "invalid-source";

export interface PersonalStorageCandidate {
  key: string;
  scope: "local" | "legacy" | "account" | "other";
  bytes: number;
  populated: boolean;
  version: number | "unknown" | null;
  reason: string;
}

export interface PersonalDomainInspection {
  domain: PersonalDomain;
  destinationPresent: boolean;
  destinationBytes: number;
  destinationVersion: number | "unknown" | null;
  safeSource: "local" | "legacy" | null;
  safeSourceBytes: number;
  safeSourceVersion: number | "unknown" | null;
  accountScopes: string[];
  otherScopes: string[];
  candidates: PersonalStorageCandidate[];
  ambiguityReason: string | null;
  recordCount: number | null;
  status: PersonalMigrationStatus;
}

export interface PersonalMigrationInspection {
  version: number;
  marker: unknown;
  domains: PersonalDomainInspection[];
}

export interface PersonalMigrationResult extends PersonalMigrationInspection {
  completedDomains: PersonalDomain[];
  conflicts: PersonalDomain[];
}

function scopedKey(scope: string, domain: string) {
  return `cosmic.scope.${scope}.${domain}`;
}

function legacyKey(domain: string) {
  const known: Record<string, string> = {
    settings: "cosmic.settings.local-data", finance: "cosmic.finance.local-data",
    garage: "cosmic.garage.local-data", notes: "cosmic.notes.local-data",
    projects: "cosmic.projects.local-data", school: "cosmic.school.local-data",
    search: "cosmic.search.recent", notifications: "cosmic.notifications",
    "afrotc-cadet-category": "cosmic.afrotc.cadet-category",
  };
  return known[domain] ?? `cosmic.${domain}.local-data`;
}

function parseVersion(raw: string | null): number | "unknown" | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as { version?: unknown };
    return typeof value.version === "number" ? value.version : "unknown";
  } catch { return "unknown"; }
}

function recordCount(raw: string | null): number | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (Array.isArray(value)) return value.length;
    if (!value || typeof value !== "object") return null;
    const arrays = Object.values(value as Record<string, unknown>).filter(Array.isArray) as unknown[][];
    return arrays.length ? arrays.reduce((total, items) => total + items.length, 0) : 1;
  } catch { return null; }
}

function storageKeys(storage: StorageLike) {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => Boolean(key));
}

function sourceFor(storage: StorageLike, domain: PersonalDomain) {
  const local = storage.getItem(scopedKey("local", domain));
  if (local !== null) return { scope: "local" as const, raw: local };
  const legacy = storage.getItem(legacyKey(domain));
  return legacy === null ? null : { scope: "legacy" as const, raw: legacy };
}

function compatibleSource(raw: string, domain: PersonalDomain) {
  if (domain === "afrotc-cadet-category") {
    const historicalValues = new Set(["First Term Cadet", "GMC", "POC"]);
    if (historicalValues.has(raw)) return true;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (domain === "weather-location" || domain === "school-note-spelling") return parsed !== null;
    if (domain === "afrotc-cadet-category") return typeof parsed === "string" && parsed.length > 0;
    return Boolean(parsed && typeof parsed === "object" && (parsed as { version?: unknown }).version === 1);
  } catch { return false; }
}

function candidatesFor(storage: StorageLike, keys: string[], domain: PersonalDomain) {
  const candidates: PersonalStorageCandidate[] = [];
  const add = (key: string, scope: PersonalStorageCandidate["scope"], reason: string) => {
    const raw = storage.getItem(key);
    if (raw === null) return;
    candidates.push({ key, scope, bytes: raw.length, populated: raw.length > 0, version: parseVersion(raw), reason });
  };
  add(scopedKey("local", domain), "local", "Historical unauthenticated default scope; proven predecessor of personal.");
  add(legacyKey(domain), "legacy", "Known unscoped legacy key for this domain.");
  for (const key of keys) {
    const match = key.match(/^cosmic\.scope\.([^\.]+)\.(.+)$/);
    if (!match || match[2] !== domain || match[1] === PERSONAL_SCOPE_ID || match[1] === "local") continue;
    const isAccount = match[1].startsWith("account-");
    add(key, isAccount ? "account" : "other", isAccount ? "Account-scoped data; never selected automatically." : "Non-canonical scope; never selected automatically.");
  }
  return candidates;
}

export function inspectPersonalMigration(storage: StorageLike): PersonalMigrationInspection {
  const keys = storageKeys(storage);
  const markerRaw = storage.getItem(PERSONAL_MIGRATION_MARKER_KEY);
  let marker: unknown = null;
  try { marker = markerRaw ? JSON.parse(markerRaw) : null; } catch { marker = "invalid"; }
  const domains = PERSONAL_DOMAINS.map((domain) => {
    const destination = storage.getItem(scopedKey(PERSONAL_SCOPE_ID, domain));
    const source = sourceFor(storage, domain);
    const candidates = candidatesFor(storage, keys, domain);
    const accountScopes = [...new Set(keys.flatMap((key) => {
      const match = key.match(/^cosmic\.scope\.(account-[^.]+)\.(.+)$/);
      return match?.[2] === domain ? [match[1]] : [];
    }))];
    const otherScopes = [...new Set(keys.flatMap((key) => {
      const match = key.match(/^cosmic\.scope\.([^.]+)\.(.+)$/);
      return match && match[2] === domain && ![PERSONAL_SCOPE_ID, "local", ...accountScopes].includes(match[1]) ? [match[1]] : [];
    }))];
    const ambiguityReason = destination === null && source === null && accountScopes.length > 1
      ? "Multiple account-scoped candidates exist and no canonical local predecessor is present."
      : destination === null && source === null && accountScopes.length === 1
        ? "Only an account-scoped candidate exists; account data is not a safe personal predecessor."
        : null;
    const status: PersonalMigrationStatus = destination !== null
      ? source === null ? "destination-present" : destination === source.raw ? "equivalent" : "conflict"
      : ambiguityReason ? accountScopes.length > 1 ? "ambiguous" : "account-source-only"
      : source === null ? "absent"
      : compatibleSource(source.raw, domain) ? "ready" : "invalid-source";
    return {
      domain, destinationPresent: destination !== null, destinationBytes: destination?.length ?? 0,
      destinationVersion: parseVersion(destination), safeSource: source?.scope ?? null,
      safeSourceBytes: source?.raw.length ?? 0, safeSourceVersion: parseVersion(source?.raw ?? null),
      accountScopes, otherScopes, candidates, ambiguityReason,
      recordCount: recordCount(destination ?? source?.raw ?? null), status,
    } satisfies PersonalDomainInspection;
  });
  return { version: PERSONAL_MIGRATION_VERSION, marker, domains };
}

export function migratePersonalStorage(storage: StorageLike): PersonalMigrationResult {
  const inspection = inspectPersonalMigration(storage);
  const completedDomains: PersonalDomain[] = [];
  const conflicts: PersonalDomain[] = [];
  for (const domain of inspection.domains) {
    if (domain.status === "ready") {
      const source = sourceFor(storage, domain.domain);
      if (source) {
        storage.setItem(scopedKey(PERSONAL_SCOPE_ID, domain.domain), source.raw);
        completedDomains.push(domain.domain);
      }
    } else if (["conflict", "ambiguous", "account-source-only", "invalid-source"].includes(domain.status)) {
      conflicts.push(domain.domain);
    } else if (["destination-present", "equivalent", "absent"].includes(domain.status)) {
      completedDomains.push(domain.domain);
    }
  }
  storage.setItem(PERSONAL_MIGRATION_MARKER_KEY, JSON.stringify({ version: PERSONAL_MIGRATION_VERSION, completedDomains, conflicts }));
  return { ...inspectPersonalMigration(storage), completedDomains, conflicts };
}

export function isSensitiveStorageKey(key: string) {
  return /(?:password|secret|token|oauth|plaid|stripe|credential|session|device|pair|kiosk|auth)/i.test(key)
    || key.startsWith("cosmic.sync.") || key.startsWith("cosmic.active-scope");
}
