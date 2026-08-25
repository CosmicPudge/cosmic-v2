"use client";

import { useEffect, useState } from "react";

import BootBackground from "./BootBackground";
import BootMessage from "./BootMessage";
import BootProgress from "./BootProgress";

import { useBoot } from "./BootManager";

const MIN_BOOT_DURATION = 900;

export default function CosmicBoot() {
  const { progress, ready } = useBoot();

  const [minimumTimeElapsed, setMinimumTimeElapsed] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, MIN_BOOT_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const hideOverlay =
    ready && minimumTimeElapsed;

  return (
    <>

      <div
        className={`
          fixed inset-0 z-[9999]
          transition-opacity duration-500 ease-out
          ${
            hideOverlay
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }
        `}
      >
        <BootBackground>
          <div className="flex flex-col items-center gap-6">

            <BootMessage
              message={
                hideOverlay
                  ? "Ready"
                  : "Starting Cosmic..."
              }
            />

            <BootProgress
              progress={progress}
            />

          </div>
        </BootBackground>
      </div>
    </>
  );
}
