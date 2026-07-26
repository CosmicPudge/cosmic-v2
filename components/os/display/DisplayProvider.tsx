"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DISPLAY_PROFILES } from "./displayProfiles";
import type {
  DisplayContextValue,
  DisplayProfile,
} from "./types";

const DisplayContext =
  createContext<DisplayContextValue | null>(null);

function getProfile(
  width: number,
  height: number
): DisplayProfile {
  const shortest = Math.min(width, height);

  if (shortest < 600) {
    return "pocket";
  }

  if (width < 1280) {
    return "compact";
  }

  if (width < 2000) {
    return "comfortable";
  }

  return "expanded";
}

export function DisplayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [metrics, setMetrics] = useState(() => {
    const width =
      typeof window === "undefined"
        ? 1920
        : window.innerWidth;

    const height =
      typeof window === "undefined"
        ? 1080
        : window.innerHeight;

    const profile = getProfile(width, height);

    return {
      width,
      height,

      aspectRatio: width / height,

      touch:
        typeof window === "undefined"
          ? false
          : navigator.maxTouchPoints > 0,

      profile,
    };
  });

  useEffect(() => {
    function updateDisplay() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setMetrics({
        width,
        height,

        aspectRatio: width / height,

        touch: navigator.maxTouchPoints > 0,

        profile: getProfile(width, height),
      });
    }

    updateDisplay();

    window.addEventListener(
      "resize",
      updateDisplay
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateDisplay
      );
    };
  }, []);

  const value = useMemo<DisplayContextValue>(
    () => ({
      ...metrics,

      tokens:
        DISPLAY_PROFILES[metrics.profile],
    }),
    [metrics]
  );

  return (
    <DisplayContext.Provider value={value}>
      {children}
    </DisplayContext.Provider>
  );
}

export function useDisplay() {
  const context = useContext(DisplayContext);

  if (!context) {
    throw new Error(
      "useDisplay must be used inside DisplayProvider."
    );
  }

  return context;
}