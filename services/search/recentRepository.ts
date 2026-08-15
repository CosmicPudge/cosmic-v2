"use client";

export interface RecentSearch {
  query: string;
  searchedAt: number;
}

export interface RecentSearchData {
  version: 1;
  searches: RecentSearch[];
}

export const SEARCH_RECENTS_KEY = "cosmic.search.recent";
const MAX_RECENTS = 10;
export const SEARCH_RECENTS_UPDATE_EVENT = "cosmic:search-recents-updated";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readRecentSearches(): RecentSearch[] {
  try {
    const raw = window.localStorage.getItem(SEARCH_RECENTS_KEY);
    const value: unknown = raw ? JSON.parse(raw) : undefined;
    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.searches)) return [];
    return value.searches
      .filter((item): item is RecentSearch => isRecord(item) && typeof item.query === "string" && typeof item.searchedAt === "number")
      .slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string) {
  const normalized = query.trim().replace(/\s+/g, " ");
  if (!normalized) return readRecentSearches();
  const searches = [
    { query: normalized, searchedAt: Date.now() },
    ...readRecentSearches().filter((item) => item.query.toLocaleLowerCase() !== normalized.toLocaleLowerCase()),
  ].slice(0, MAX_RECENTS);
  const data: RecentSearchData = { version: 1, searches };
  window.localStorage.setItem(SEARCH_RECENTS_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(SEARCH_RECENTS_UPDATE_EVENT, { detail: searches }));
  return searches;
}

export function clearRecentSearches() {
  window.localStorage.removeItem(SEARCH_RECENTS_KEY);
  window.dispatchEvent(new CustomEvent(SEARCH_RECENTS_UPDATE_EVENT, { detail: [] }));
}

export function replaceRecentSearches(data: RecentSearchData) {
  if (data.version !== 1 || !Array.isArray(data.searches) || !data.searches.every((item) => isRecord(item) && typeof item.query === "string" && typeof item.searchedAt === "number")) {
    throw new Error("Invalid Search history data.");
  }
  const next = { version: 1 as const, searches: data.searches.slice(0, MAX_RECENTS) };
  window.localStorage.setItem(SEARCH_RECENTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(SEARCH_RECENTS_UPDATE_EVENT, { detail: next.searches }));
}
