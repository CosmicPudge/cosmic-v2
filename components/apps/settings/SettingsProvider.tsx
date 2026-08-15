"use client";

import { createContext, useContext, useEffect } from "react";

import { type SettingsRepository, useSettingsRepository } from "@/services/settings/localRepository";

const SettingsContext = createContext<SettingsRepository | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const repository = useSettingsRepository();

  useEffect(() => {
    document.documentElement.dataset.cosmicReducedEffects = repository.data.appearance.reducedEffects ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.cosmicReducedEffects;
    };
  }, [repository.data.appearance.reducedEffects]);

  return <SettingsContext.Provider value={repository}>{children}</SettingsContext.Provider>;
}

export function useSettingsData() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettingsData must be used inside SettingsProvider.");
  return value;
}
