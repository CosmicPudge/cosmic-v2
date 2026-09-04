"use client";

import { CosmicApp } from "@/lib/apps";
import { useWindowStore } from "@/stores/windowStore";

interface DockIconProps {
  app: CosmicApp;
}

export default function DockIcon({ app }: DockIconProps) {
  const openWindow = useWindowStore((state) => state.openWindow);

  const window = useWindowStore(
    (state) => state.windows[app.id]
  );

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => openWindow(app.id)}
        className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10 active:scale-[0.98]"
      >
        {app.icon}
      </button>

      <div
        className={`mt-1 h-1.5 w-1.5 rounded-full transition-opacity ${
          window.open
            ? "bg-white opacity-100"
            : "opacity-0"
        }`}
      />
    </div>
  );
}
