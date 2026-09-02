"use client";

import { useEffect, useMemo, useState } from "react";

import type { SchoolDashboardData } from "../data/types";
import {
  SchoolIntelligence,
  buildSchoolIntelligence,
} from "../data/intelligence";
import { hydrateSchoolDashboard } from "../data/normalize";
import { useLocalSchoolRepository } from "../data/localRepository";
import { buildSchoolSnapshot, hydrateSchoolSnapshot } from "@/services/school/domain";
import type { SchoolSnapshot } from "@/services/school/domain";
import type { RecommendationNarration } from "@/services/school/planning/recommendationNarrator";

interface UseSchoolDataOptions { enabled?: boolean }

export function useSchoolData({ enabled = true }: UseSchoolDataOptions = {}) {
  const local = useLocalSchoolRepository({ enabled });
  const [data, setData] = useState<SchoolDashboardData | null>(null);
  const [snapshot, setSnapshot] = useState<SchoolSnapshot | null>(null);
  const [recommendationNarration, setRecommendationNarration] = useState<RecommendationNarration | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!enabled) return;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/school/calendar", { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Unable to load school data.");
        }

        const body = await res.json() as { data?: unknown; snapshot?: SchoolSnapshot; recommendationNarration?: RecommendationNarration; error?: string };
        const json = hydrateSchoolDashboard((body.data ?? body) as Parameters<typeof hydrateSchoolDashboard>[0]);

        setData(json);
        // JSON serialization turns the server snapshot's Date fields into
        // strings. Rebuild it from the already-hydrated dashboard data so
        // every client consumer receives the Date-based contract.
        const normalizedSnapshot = buildSchoolSnapshot(json);
        const hydratedServerSnapshot = hydrateSchoolSnapshot(body.snapshot);
        setSnapshot(hydratedServerSnapshot ? { ...normalizedSnapshot, ...hydratedServerSnapshot } : normalizedSnapshot);
        setRecommendationNarration(body.recommendationNarration ?? null);
        setError(body.error);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unknown error"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
    const refresh = () => void load();
    window.addEventListener("cosmic:school-refresh", refresh);
    return () => window.removeEventListener("cosmic:school-refresh", refresh);
  }, [enabled]);

  const intelligence: SchoolIntelligence | null =
    useMemo(() => {
      if (!enabled || !data) return null;

      return buildSchoolIntelligence(data, snapshot ?? undefined);
    }, [data, enabled, snapshot]);

  const normalizedSnapshot = useMemo(() => !enabled ? null : snapshot ?? (data ? buildSchoolSnapshot(data) : null), [data, enabled, snapshot]);

  return {
    data: enabled ? data : null,

    intelligence,

    snapshot: normalizedSnapshot,

    loading: enabled ? loading : false,

    error: enabled ? error : undefined,

    recommendationNarration: enabled ? recommendationNarration : null,

    local,
  };
}
