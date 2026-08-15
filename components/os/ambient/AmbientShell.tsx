"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

export default function AmbientShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const exitingRef = useRef(false);

  const exitAmbient = useCallback(() => {
    if (exitingRef.current) {
      return;
    }

    exitingRef.current = true;
    router.replace("/os");
  }, [router]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });

    const handleKeyDown = () => exitAmbient();
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [exitAmbient]);

  return (
    <div
      ref={rootRef}
      className="relative min-h-[100svh] overflow-hidden bg-transparent text-white outline-none"
      tabIndex={0}
      aria-label="Ambient mode. Press anywhere or press any key to return to the dashboard."
      onPointerDownCapture={exitAmbient}
      onTouchStartCapture={exitAmbient}
      onClickCapture={exitAmbient}
    >
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(1,3,12,0.2),rgba(1,3,12,0.04)_45%,rgba(1,3,12,0.28))] pointer-events-none" />

      <main className="ambient-enter relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1600px] items-center px-[max(1.25rem,env(safe-area-inset-left))] py-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 lg:px-14">
        {children}
      </main>
      <span className="sr-only">Press anywhere to return to the dashboard.</span>
    </div>
  );
}
