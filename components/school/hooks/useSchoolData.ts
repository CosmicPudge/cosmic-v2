"use client";

import { useEffect, useMemo, useState } from "react";

import { SchoolDashboardData } from "../data/types";
import {
  SchoolIntelligence,
  buildSchoolIntelligence,
} from "../data/intelligence";

export function useSchoolData() {
  const [data, setData] = useState<SchoolDashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string>();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/school/calendar");

        if (!res.ok) {
          throw new Error("Unable to load school data.");
        }

        const json: SchoolDashboardData = await res.json();

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
  };
}