"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWindowStore, WindowId } from "@/stores/windowStore";

interface OSContextType {
  openWindow: (name: WindowId) => void;
  closeWindow: (name: WindowId) => void;
}

const OSContext = createContext<OSContextType | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const openWindow = useWindowStore((state) => state.openWindow);
  const closeWindow = useWindowStore((state) => state.closeWindow);

  return (
    <OSContext.Provider
      value={{
        openWindow,
        closeWindow,
      }}
    >
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const context = useContext(OSContext);

  if (!context) {
    throw new Error("useOS must be used inside OSProvider");
  }

  return context;
}