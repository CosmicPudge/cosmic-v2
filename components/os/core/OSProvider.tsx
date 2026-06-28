"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type WindowName = "weather";

interface OSContextType {
  openWindows: WindowName[];
  openWindow: (name: WindowName) => void;
  closeWindow: (name: WindowName) => void;
}

const OSContext = createContext<OSContextType | null>(null);

export function OSProvider({ children }: { children: ReactNode }) {
  const [openWindows, setOpenWindows] = useState<WindowName[]>([]);

  function openWindow(name: WindowName) {
    setOpenWindows((prev) =>
      prev.includes(name) ? prev : [...prev, name]
    );
  }

  function closeWindow(name: WindowName) {
    setOpenWindows((prev) =>
      prev.filter((window) => window !== name)
    );
  }

  return (
    <OSContext.Provider
      value={{
        openWindows,
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