"use client";

import GlassPanel from "../ui/GlassPanel";
import { useOS } from "../core/OSProvider";

export default function Dock() {
  const { openWindow } = useOS();

  return (
    <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2">
      <GlassPanel className="flex items-center gap-4 px-5 py-3">

        <button
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
        >
          🏠
        </button>

        <button
          onClick={() => openWindow("weather")}
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
        >
          🌤️
        </button>

        <button
  onClick={() => openWindow("calendar")}
  className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
>
  📅
</button>

        <button
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
        >
          ⚾
        </button>

        <button
  onClick={() => openWindow("garage")}
  className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
>
  🚗
</button>

        <button
  onClick={() => openWindow("settings")}
  className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
>
  ⚙️
</button>

      </GlassPanel>
    </div>
  );
}