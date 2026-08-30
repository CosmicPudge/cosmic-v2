"use client";

import { useEffect, useMemo, useState } from "react";

import { SchoolDashboardData } from "../data/types";
import {
  SchoolIntelligence,
  buildSchoolIntelligence,
} from "../data/intelligence";
import { hydrateSchoolDashboard } from "../data/normalize";
import { useLocalSchoolRepository } from "../data/localRepository";

export function useSchoolData() {
  const local = useLocalSchoolRepository();
  const [data, setData] = useState<SchoolDashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string>();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/school/calendar", { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Unable to load school data.");
        }

        const json = hydrateSchoolDashboard(
          await res.json()
        );

        setData(json);
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
  }, []);

  const intelligence: SchoolIntelligence | null =
    useMemo(() => {
      if (!data) return null;

      return buildSchoolIntelligence(data);
    }, [data]);

  return {
    data,

    intelligence,

    loading,

    error,

    local,
  };
}
