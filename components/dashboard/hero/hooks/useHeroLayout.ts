"use client";

import { useEffect, useRef, useState } from "react";

export type HeroLayoutMode =
  | "horizontal"
  | "vertical";

export function useHeroLayout() {
  const ref = useRef<HTMLDivElement>(null);

  const [layout, setLayout] =
    useState<HeroLayoutMode>("horizontal");

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new ResizeObserver(
      ([entry]) => {
        const width =
          entry.contentRect.width;

        setLayout(
          width < 920
            ? "vertical"
            : "horizontal"
        );
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return {
    ref,
    layout,
  };
}