"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useModeStore } from "@/stores/modeStore";

export default function ModeManager() {
  const router = useRouter();
  const pathname = usePathname();

  const mode = useModeStore(
    (state) => state.mode
  );

  useEffect(() => {
    switch (mode) {
      case "desktop":
        if (pathname !== "/os") {
          router.push("/os");
        }
        break;

      case "ambient":
        if (pathname !== "/kiosk") {
          router.push("/kiosk");
        }
        break;

      case "sports":
        if (pathname !== "/sports") {
          router.push("/sports");
        }
        break;
    }
  }, [mode, pathname, router]);

  return null;
}
