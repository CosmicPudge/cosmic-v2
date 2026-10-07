"use client";

import { createContext, useContext, useEffect } from "react";

import { type SettingsRepository, useSettingsRepository } from "@/services/settings/localRepository";

const SettingsContext = createContext<SettingsRepository | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const repository = useSettingsRepository();

  useEffect(() => {
    document.documentElement.dataset.cosmicReducedEffects = repository.data.appearance.reducedEffects ? "true" : "false";
    document.documentElement.dataset.cosmosSurface = repository.data.appearance.surfaceStyle;
    return () => {
      delete document.documentElement.dataset.cosmicReducedEffects;
      delete document.documentElement.dataset.cosmosSurface;
    };
  }, [repository.data.appearance.reducedEffects, repository.data.appearance.surfaceStyle]);

  return <SettingsContext.Provider value={repository}>{children}</SettingsContext.Provider>;
}

export function useSettingsData() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettingsData must be used inside SettingsProvider.");
  return value;
}
