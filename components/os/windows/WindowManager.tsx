"use client";

import { useWindowStore } from "@/stores/windowStore";
import { windowRegistry } from "@/config/os/windowRegistry";

export default function WindowManager() {
  const windows = useWindowStore((state) => state.windows);

  return (
    <>
      {Object.entries(windows).map(([id, window]) => {
        if (!window.open) return null;

        const WindowComponent = windowRegistry[window.id];

        if (!WindowComponent) return null;

        return (
          <WindowComponent
            key={id}
          />
        );
      })}
    </>
  );
}