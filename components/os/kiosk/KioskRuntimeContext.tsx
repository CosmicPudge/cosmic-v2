"use client";

import { createContext, useContext } from "react";

const KioskRuntimeContext = createContext(true);

export function KioskRuntimeProvider({ ready, children }: { ready: boolean; children: React.ReactNode }) {
  return <KioskRuntimeContext.Provider value={ready}>{children}</KioskRuntimeContext.Provider>;
}

export function useKioskRuntimeReady() {
  return useContext(KioskRuntimeContext);
}
