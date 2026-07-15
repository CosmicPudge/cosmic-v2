"use client";

import { useEffect, useState } from "react";

import BootBackground from "./BootBackground";
import BootLogo from "./BootLogo";
import BootMessage from "./BootMessage";
import BootProgress from "./BootProgress";

interface Props {
  children: React.ReactNode;
  subtitle?: string;
  messages?: string[];
}

const defaultMessages = [
  "Initializing Core...",
  "Loading Environment...",
  "Preparing Workspace...",
  "Welcome.",
];

const BOOT_TIME = 15000; // 15 seconds

export default function CosmicBoot({
  children,
  subtitle,
  messages,
}: Props) {
  const bootMessages = messages ?? defaultMessages;

  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);

  //
  // Smooth progress animation
  //
  useEffect(() => {
    const start = performance.now();

    let animationFrame: number;

    function animate(now: number) {
      const elapsed = now - start;

      const percent = Math.min(
        (elapsed / BOOT_TIME) * 100,
        100
      );

      setProgress(percent);

      if (percent < 100) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setBootComplete(true);
      }
    }

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  //
  // Boot messages
  //
  useEffect(() => {
    const interval = BOOT_TIME / bootMessages.length;

    const timers = bootMessages
      .slice(1)
      .map((_, index) =>
        setTimeout(() => {
          setStep(index + 1);
        }, interval * (index + 1))
      );

    return () => timers.forEach(clearTimeout);
  }, [bootMessages]);

  return (
    <>
      {/* Desktop stays mounted */}
      {children}

      {/* Boot Overlay */}
      <div
        className={`
          fixed inset-0 z-[9999]

          transition-opacity
          duration-1000
          ease-in-out

          ${
            bootComplete
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }
        `}
      >
        <BootBackground>
          <div className="flex flex-col items-center">

            <BootLogo
              subtitle={subtitle}
            />

            <BootMessage
              message={bootMessages[step]}
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