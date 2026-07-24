"use client";

import { useContext } from "react";

import {
  PerformanceContext,
} from "./PerformanceContext";

export function usePerformance() {
  const context = useContext(
    PerformanceContext
  );

  if (!context) {
    throw new Error(
      "usePerformance must be used inside a PerformanceProvider."
    );
  }

  return context;
}