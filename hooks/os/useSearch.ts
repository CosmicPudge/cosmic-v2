"use client";

import { useEffect, useMemo, useState } from "react";

import type { SearchCategory, SearchSnapshot } from "@/core/contracts/Search";
import { normalizeSearchQuery } from "@/core/search/SearchEngine";
import { useSearchRuntime } from "@/components/apps/search/SearchProvider";

export function useSearchResults(
  query: string,
  category: SearchCategory | "all" = "all",
  contextCategory?: SearchCategory,
) {
  const { engine } = useSearchRuntime();
  const categories = useMemo(() => category === "all" ? undefined : [category], [category]);
  const [snapshot, setSnapshot] = useState<SearchSnapshot>(() => ({
    query: normalizeSearchQuery(query, categories, contextCategory),
    results: [],
    warnings: [],
    complete: !query.trim(),
  }));

  useEffect(() => {
    const controller = new AbortController();
    const start = window.setTimeout(() => {
      if (!query.trim()) {
        setSnapshot({
          query: normalizeSearchQuery(query, categories, contextCategory),
          results: [],
          warnings: [],
          complete: true,
        });
        return;
      }

      void engine.search(query, {
        categories,
        contextCategory,
        signal: controller.signal,
        onPartial: (next) => {
          if (!controller.signal.aborted) setSnapshot(next);
        },
      });
    }, 0);

    return () => {
      window.clearTimeout(start);
      controller.abort();
    };
  }, [categories, contextCategory, engine, query]);

  return snapshot;
}
