"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

export default function KioskShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const leavingRef = useRef(false);

  const leaveKiosk = useCallback(() => {
    if (leavingRef.current) {
      return;
    }

    leavingRef.current = true;
    router.replace("/os");
  }, [router]);

  useEffect(() => {
    const handleKeyDown = () => {
      leaveKiosk();
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
      {
        capture: true,
      },
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
        true,
      );
    };
  }, [leaveKiosk]);

  return (
    <div
      className="relative min-h-[100svh] overflow-hidden bg-transparent text-white"
      onPointerDownCapture={leaveKiosk}
      onTouchStartCapture={leaveKiosk}
    >
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(1,3,12,.16),transparent_45%,rgba(1,3,12,.22))]" />

      <main className="relative z-10 min-h-[100svh]">
        {children}
      </main>
    </div>
  );
}