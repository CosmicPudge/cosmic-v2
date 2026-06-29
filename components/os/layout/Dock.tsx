"use client";
import { useWindowStore } from "@/stores/windowStore";
import GlassPanel from "../ui/GlassPanel";
import { useOS } from "../core/OSProvider";

export default function Dock() {
  const { openWindow } = useOS();
  const windows = useWindowStore((state) => state.windows);

  return (
    <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2">
      <GlassPanel className="flex items-center gap-4 px-5 py-3">

        <button
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
        >
          🏠
        </button>

       <div className="flex flex-col items-center">
  <button
    onClick={() => openWindow("weather")}
    className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
  >
    🌤️
  </button>

  <div
    className={`mt-1 h-1.5 w-1.5 rounded-full transition-opacity ${
      windows.weather.open
        ? "bg-white opacity-100"
        : "opacity-0"
    }`}
  />
</div>

        <button
  onClick={() => openWindow("calendar")}
  className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 hover:scale-110 hover:bg-white/10"
>
  📅
</button>

        <button
  onClick={() => openWindow("sports")}
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