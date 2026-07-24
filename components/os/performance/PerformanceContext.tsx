"use client";

import { createContext } from "react";

import type {
  PerformanceProfile,
} from "./PerformanceProfiles";

export interface PerformanceContextValue {
  profile: PerformanceProfile;

  fps: number;

  frameTime: number;

  upgrade(): void;

  downgrade(): void;
}

export const PerformanceContext =
  createContext<PerformanceContextValue | null>(null);