"use client";

import {
  ReactNode,
  useMemo,
} from "react";

import {
  PerformanceContext,
} from "./PerformanceContext";

import { useSystem } from "@/components/os/system/SystemProvider";
import { PerformanceProfiles } from "./PerformanceProfiles";

import type {
  PerformanceProfile,
} from "./PerformanceProfiles";

interface PerformanceProviderProps {
  children: ReactNode;
}

export default function PerformanceProvider({
  children,
}: PerformanceProviderProps) {
  const { snapshot } = useSystem();
  const profile = useMemo<PerformanceProfile>(() => {
    if (snapshot.power.effective === "reduced") return PerformanceProfiles.mobile;
    if (snapshot.power.effective === "balanced") return PerformanceProfiles.laptop;
    return PerformanceProfiles.desktop;
  }, [snapshot.power.effective]);

  function upgrade() {
    // Implemented in Phase 8.5
  }

  function downgrade() {
    // Implemented in Phase 8.5
  }

  return (
    <PerformanceContext.Provider
      value={{
        profile,
        fps: profile.targetFPS,
        frameTime: 1000 / profile.targetFPS,
        upgrade,
        downgrade,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}
