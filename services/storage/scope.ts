"use client";

import { useSyncExternalStore } from "react";

export type CosmicScopeKind = "local" | "account" | "dev";

export interface CosmicDataScope {
  id: string;
  kind: CosmicScopeKind;
}

export const ACTIVE_SCOPE_STORAGE_KEY = "cosmic.active-scope";
export const SCOPE_CHANGED_EVENT = "cosmic:scope-changed";
export const DEFAULT_COSMIC_SCOPE: CosmicDataScope = { id: "local", kind: "local" };

function normalizeScopeId(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "local";
}

export function getDefaultCosmicScope(): CosmicDataScope {
  return DEFAULT_COSMIC_SCOPE;
}

export function getActiveCosmicScope(): CosmicDataScope {
  if (typeof window === "undefined") return DEFAULT_COSMIC_SCOPE;
  const id = normalizeScopeId(window.localStorage.getItem(ACTIVE_SCOPE_STORAGE_KEY) ?? DEFAULT_COSMIC_SCOPE.id);
  return { id, kind: id === "local" ? "local" : id.startsWith("account-") ? "account" : "dev" };
}

export function createScopedStorageKey(domain: string, scopeId = getActiveCosmicScope().id) {
  return `cosmic.scope.${normalizeScopeId(scopeId)}.${normalizeScopeId(domain)}`;
}

export function setActiveCosmicScope(scope: CosmicDataScope | string) {
  const next = typeof scope === "string" ? normalizeScopeId(scope) : normalizeScopeId(scope.id);
  window.localStorage.setItem(ACTIVE_SCOPE_STORAGE_KEY, next);
  const kind = typeof scope === "string" ? (next === "local" ? "local" : "dev") : scope.kind;
  window.dispatchEvent(new CustomEvent(SCOPE_CHANGED_EVENT, { detail: { id: next, kind } satisfies CosmicDataScope }));
}

let revision = 0;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onChange = () => { revision += 1; listeners.forEach((item) => item()); };
  window.addEventListener(SCOPE_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => { listeners.delete(listener); window.removeEventListener(SCOPE_CHANGED_EVENT, onChange); window.removeEventListener("storage", onChange); };
}

export function useCosmicScope() {
  useSyncExternalStore(subscribe, () => `${getActiveCosmicScope().id}:${revision}`, () => "local:0");
  return getActiveCosmicScope();
}

export function legacyStorageKey(domain: string) {
  return `cosmic.${domain}.local-data`;
}

export function readScopedOrLegacy(domain: string, scopeId = getActiveCosmicScope().id, legacyKey = legacyStorageKey(domain)) {
  const scopedKey = createScopedStorageKey(domain, scopeId);
  const scoped = window.localStorage.getItem(scopedKey);
  if (scoped !== null) return { raw: scoped, key: scopedKey, migrated: false };
  if (normalizeScopeId(scopeId) !== "local") return { raw: null, key: scopedKey, migrated: false };
  const legacy = window.localStorage.getItem(legacyKey);
  return { raw: legacy, key: scopedKey, migrated: Boolean(legacy) };
}

export function migrateLegacyStorage(domain: string, raw: string, scopeId = getActiveCosmicScope().id) {
  const key = createScopedStorageKey(domain, scopeId);
  if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, raw);
  return key;
}
