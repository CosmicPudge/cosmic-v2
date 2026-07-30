"use client";

import type { WindowInstance } from "./types";
import WindowRegistry from "./WindowRegistry";

interface WindowFrameProps {
  window: WindowInstance;
}

export default function WindowFrame({
  window,
}: WindowFrameProps) {
  return (
    <div
      className="
        absolute
        left-1/2
        top-1/2
        z-50
        h-[650px]
        w-[1000px]
        -translate-x-1/2
        -translate-y-1/2
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-black/50
        shadow-2xl
        backdrop-blur-3xl
      "
    >
      <div className="flex h-14 items-center border-b border-white/10 px-6">
        <h2 className="text-lg font-semibold">
          {window.title}
        </h2>
      </div>

      <div className="h-[calc(100%-56px)] overflow-hidden">
  <WindowRegistry id={window.id} />
</div>
    </div>
  );
}