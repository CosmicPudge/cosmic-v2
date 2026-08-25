"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BootTask =
  | "desktop"
  | "background"
  | "header"
  | "sidebar"
  | "widgets"
  | "weather"
  | "school"
  | "garage"
  | "sports"
  | "assistant";

type BootState = Record<BootTask, boolean>;

const INITIAL_STATE: BootState = {
  desktop: false,
  background: false,
  header: false,
  sidebar: false,
  widgets: false,
  weather: false,
  school: false,
  garage: false,
  sports: false,
  assistant: false,
};

interface BootContextValue {
  state: BootState;
  complete: (task: BootTask) => void;
  progress: number;
  ready: boolean;
}

const BootContext = createContext<BootContextValue | null>(null);

export function BootProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState(INITIAL_STATE);

  const complete = useCallback((task: BootTask) => {
    setState((prev) => {
      if (prev[task]) return prev;

      return {
        ...prev,
        [task]: true,
      };
    });
  }, []);

  const progress = useMemo(() => {
    const completeCount = Object.values(state).filter(Boolean).length;

    return (
      (completeCount / Object.keys(state).length) * 100
    );
  }, [state]);

  // Only these tasks are required before removing
  // the boot overlay.
  const ready =
    state.desktop &&
    state.background &&
    state.header &&
    state.sidebar;

  const value = useMemo(
    () => ({
      state,
      complete,
      progress,
      ready,
    }),
    [state, complete, progress, ready]
  );

  return (
    <BootContext.Provider value={value}>
      {children}
    </BootContext.Provider>
  );
}

export function useBoot() {
  const context = useContext(BootContext);

  if (!context) {
    throw new Error(
      "useBoot must be used within a BootProvider"
    );
  }

  return context;
}

export function useOptionalBoot() {
  return useContext(BootContext);
}
