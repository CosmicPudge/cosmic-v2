"use client";

import GlassPanel from "../ui/GlassPanel";
import { apps } from "@/lib/apps";
import DockIcon from "./DockIcon";

export default function Dock() {
  return (
    <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2">
      <GlassPanel className="flex items-center gap-4 px-5 py-3">

        <button
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10 active:scale-[0.98]"
        >
          🏠
        </button>

        {apps
          .filter((app) => app.dock)
          .map((app) => (
            <DockIcon
              key={app.id}
              app={app}
            />
          ))}

      </GlassPanel>
    </div>
  );
}
