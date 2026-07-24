"use client";

import {
  ReactNode,
  useMemo,
  useState,
} from "react";

import {
  PerformanceContext,
} from "./PerformanceContext";

import {
  PerformanceMonitor,
} from "./PerformanceMonitor";

import type {
  PerformanceProfile,
} from "./PerformanceProfiles";

interface PerformanceProviderProps {
  children: ReactNode;
}

export default function PerformanceProvider({
  children,
}: PerformanceProviderProps) {
  const monitor = useMemo(
    () => new PerformanceMonitor(),
    []
  );

  const [profile, setProfile] =
    useState<PerformanceProfile>(
      monitor.getProfile()
    );

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