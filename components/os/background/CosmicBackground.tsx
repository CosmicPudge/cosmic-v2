"use client";

import { type PropsWithChildren, useEffect } from "react";
import BackgroundCanvas from "./BackgroundCanvas";
import { useBoot } from "@/components/os/boot/BootManager";

export default function CosmicBackground({
  children,
}: PropsWithChildren) {
  const { complete } = useBoot();

  useEffect(() => {
    complete("background");
  }, [complete]);

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