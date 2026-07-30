"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  WindowContextValue,
  WindowInstance,
} from "./types";

const WindowContext =
  createContext<WindowContextValue | null>(null);

export function WindowProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] =
    useState<string | null>(null);

  const openWindow = useCallback(
    (id: string, title = id) => {
      setWindows((current) => {
        const existing = current.find(
          (window) => window.id === id
        );

        if (existing) {
          setActiveWindowId(id);
          return current;
        }

        setActiveWindowId(id);

        return [
          ...current,
          {
            id,
            title,
            state: "normal",
          },
        ];
      });
    },
    []
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((current) => {
      const updated = current.filter(
        (window) => window.id !== id
      );

      setActiveWindowId(
        updated.length
          ? updated[updated.length - 1].id
          : null
      );

      return updated;
    });
  }, []);

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id);
  }, []);

  const value = useMemo(
    () => ({
      windows,
      activeWindowId,
      openWindow,
      closeWindow,
      focusWindow,
    }),
    [
      windows,
      activeWindowId,
      openWindow,
      closeWindow,
      focusWindow,
    ]
  );

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
}

export function useWindow() {
  const context = useContext(WindowContext);

  if (!context) {
    throw new Error(
      "useWindow must be used inside WindowProvider."
    );
  }

  return context;
}