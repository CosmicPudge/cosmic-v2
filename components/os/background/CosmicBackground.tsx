"use client";

import type { PropsWithChildren } from "react";
import BackgroundCanvas from "./BackgroundCanvas";

const containerStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  backgroundColor: "#050712",
} as const;

const contentStyle = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  height: "100%",
} as const;

export default function CosmicBackground({ children }: PropsWithChildren) {
  return (
    <div style={containerStyle}>
      <BackgroundCanvas />
      <div style={contentStyle}>{children}</div>
    </div>
  );
}