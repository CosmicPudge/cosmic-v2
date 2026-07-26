"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import useIdle from "@/hooks/os/useIdle";

import { useModeStore } from "@/stores/modeStore";

export default function ModeManager() {
  const router = useRouter();

  const mode = useModeStore(
    (state) => state.mode
  );

  const setMode = useModeStore(
    (state) => state.setMode
  );
  
  useEffect(() => {
    switch (mode) {
      case "desktop":
        router.push("/os");
        break;

      case "ambient":
        router.push("/os/ambient");
        break;

      case "sports":
        router.push("/sports");
        break;
    }
  }, [mode, router]);

  return null;
}