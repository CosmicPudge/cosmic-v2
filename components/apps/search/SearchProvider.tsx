"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

import { SearchEngine } from "@/core/search/SearchEngine";
import { createSearchProviders } from "@/services/search/providers";
import {
  clearRecentSearches,
  readRecentSearches,
  saveRecentSearch,
  SEARCH_RECENTS_KEY,
  type RecentSearch,
} from "@/services/search/recentRepository";
import SearchOverlay from "@/components/os/overlays/SearchOverlay";
import { useEntitlements } from "@/hooks/os/useEntitlements";

interface SearchRuntimeValue {
  engine: SearchEngine;
  recentSearches: RecentSearch[];
  overlayOpen: boolean;
  overlayQuery: string;
  openSearch(query?: string): void;
  closeSearch(): void;
  recordSearch(query: string): void;
  clearRecents(): void;
}

const SearchRuntimeContext = createContext<SearchRuntimeValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: entitlements } = useEntitlements();
  const schoolEnabled = entitlements.features["school.basic"];
  const engine = useMemo(() => {
    const instance = new SearchEngine();
    createSearchProviders({ schoolEnabled }).forEach((provider) => instance.register(provider));
    return instance;
  }, [schoolEnabled]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayQuery, setOverlayQuery] = useState("");
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const initial = window.setTimeout(() => setRecentSearches(readRecentSearches()), 0);
    const sync = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent && event.key !== SEARCH_RECENTS_KEY) return;
      setRecentSearches(readRecentSearches());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("cosmic:search-recents-updated", sync);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("storage", sync);
      window.removeEventListener("cosmic:search-recents-updated", sync);
    };
  }, []);

  const openSearch = useCallback((query = "") => {
    if (pathname === "/os/ambient") return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOverlayQuery(query);
    setOverlayOpen(true);
  }, [pathname]);

  const closeSearch = useCallback(() => {
    setOverlayOpen(false);
    window.setTimeout(() => previousFocus.current?.focus({ preventScroll: true }), 0);
  }, []);

  useEffect(() => {
    if (pathname !== "/os/ambient") return;
    const closeForAmbient = window.setTimeout(() => setOverlayOpen(false), 0);
    return () => window.clearTimeout(closeForAmbient);
  }, [pathname]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (pathname === "/os/ambient") return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [openSearch, pathname]);

  const recordSearch = useCallback((query: string) => {
    setRecentSearches(saveRecentSearch(query));
  }, []);

  const clearRecents = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const value = useMemo(() => ({
    engine,
    recentSearches,
    overlayOpen,
    overlayQuery,
    openSearch,
    closeSearch,
    recordSearch,
    clearRecents,
  }), [clearRecents, closeSearch, engine, openSearch, overlayOpen, overlayQuery, recentSearches, recordSearch]);

  return (
    <SearchRuntimeContext.Provider value={value}>
      {children}
      <SearchOverlay />
    </SearchRuntimeContext.Provider>
  );
}

export function useSearchRuntime() {
  const value = useContext(SearchRuntimeContext);
  if (!value) throw new Error("useSearchRuntime must be used inside SearchProvider.");
  return value;
}
