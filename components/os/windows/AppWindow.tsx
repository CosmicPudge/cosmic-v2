"use client";

import { ReactNode } from "react";
import { useRef } from "react";

import GlassPanel from "@/components/os/ui/GlassPanel";
import { useOS } from "@/components/os/core/OSProvider";
import { useWindowStore, WindowId } from "@/stores/windowStore";

interface AppWindowProps {
  title: string;
  windowName: WindowId;
  children: ReactNode;
}

export default function AppWindow({
  title,
  windowName,
  children,
}: AppWindowProps) {
  const { closeWindow } = useOS();

  const focusWindow = useWindowStore((state) => state.focusWindow);
  const windowState = useWindowStore(
    (state) => state.windows[windowName]
  );

  const moveWindow = useWindowStore((state) => state.moveWindow);

const dragOffset = useRef({
  x: 0,
  y: 0,
});

const dragging = useRef(false);

function handlePointerDown(
  event: React.PointerEvent<HTMLDivElement>
) {
  dragging.current = true;

  dragOffset.current = {
    x: event.clientX - windowState.x,
    y: event.clientY - windowState.y,
  };

  focusWindow(windowName);

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
}
function handlePointerMove(event: PointerEvent) {
  if (!dragging.current) return;

  moveWindow(
    windowName,
    event.clientX - dragOffset.current.x,
    event.clientY - dragOffset.current.y
  );
}
function handlePointerUp() {
  dragging.current = false;

  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", handlePointerUp);
}

  return (
    <div
      onMouseDown={() => focusWindow(windowName)}
      className="absolute w-[700px] max-w-[90vw]"
      style={{
        left: windowState.x,
        top: windowState.y,
        zIndex: windowState.zIndex,
      }}
    >
      <GlassPanel className="overflow-hidden p-0">
        <div
  onPointerDown={handlePointerDown}
  className="window-titlebar flex cursor-move items-center justify-between border-b border-white/10 px-5 py-3 select-none"
>
          <h2 className="font-semibold">{title}</h2>

          <button
            onClick={() => closeWindow(windowName)}
            className="rounded-lg px-2 py-1 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </GlassPanel>
    </div>
  );
}