"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  PERSONAL_COSMIC_APPLICATION,
  type CosmicApplicationContext,
} from "@/core/contracts/Application";

const CosmicApplicationContext = createContext<CosmicApplicationContext>(
  PERSONAL_COSMIC_APPLICATION,
);

export function PersonalCosmicProvider({ children }: { children: ReactNode }) {
  return (
    <CosmicApplicationContext.Provider value={PERSONAL_COSMIC_APPLICATION}>
      {children}
    </CosmicApplicationContext.Provider>
  );
}

export function useCosmicApplication() {
  return useContext(CosmicApplicationContext);
}
