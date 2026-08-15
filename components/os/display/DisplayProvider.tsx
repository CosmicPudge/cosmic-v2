"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { useSystem } from "@/components/os/system/SystemProvider";
import { DISPLAY_PROFILES } from "./displayProfiles";
import type {
  DisplayContextValue,
  DisplayProfile,
} from "./types";

const DisplayContext =
  createContext<DisplayContextValue | null>(null);

export function DisplayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { snapshot } = useSystem();
  const width = snapshot.display.viewportWidth ?? 1920;
  const height = snapshot.display.viewportHeight ?? 1080;
  const profile: DisplayProfile = snapshot.display.profile === "compact"
    ? "pocket"
    : snapshot.display.profile === "regular"
      ? "compact"
      : snapshot.display.profile === "display"
        ? "expanded"
        : "comfortable";

  const value = useMemo<DisplayContextValue>(
    () => ({
      width,
      height,
      aspectRatio: width / height,
      touch: snapshot.input.touch,
      profile,
      tokens: DISPLAY_PROFILES[profile],
    }),
    [height, profile, snapshot.input.touch, width]
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
