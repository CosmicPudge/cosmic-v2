"use client";

import { type PropsWithChildren, useEffect } from "react";
import BackgroundCanvas from "./BackgroundCanvas";

export default function CosmicBackground({
  children,
}: PropsWithChildren) {

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          backgroundColor: "#050712",
          zIndex: 0,
        }}
      >
        <BackgroundCanvas />
      </div>

      {children}
    </>
  );
}