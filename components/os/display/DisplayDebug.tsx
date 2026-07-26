"use client";

import { useDisplay } from "@/components/os/display";

export default function DisplayDebug() {
  const display = useDisplay();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      className="
        fixed
        bottom-4
        right-4
        z-[9999]

        rounded-2xl
        border
        border-white/10

        bg-black/70

        px-4
        py-3

        text-xs
        text-white

        backdrop-blur-xl
        font-mono
      "
    >
      <div>
        <strong>Profile:</strong>{" "}
        {display.profile}
      </div>

      <div>
        <strong>Size:</strong>{" "}
        {display.width} × {display.height}
      </div>

      <div>
        <strong>Aspect:</strong>{" "}
        {display.aspectRatio.toFixed(2)}
      </div>

      <div>
        <strong>Touch:</strong>{" "}
        {display.touch ? "Yes" : "No"}
      </div>

      <div>
        <strong>Gap:</strong>{" "}
        {display.tokens.widgetGap}px
      </div>

      <div>
        <strong>Blur:</strong>{" "}
        {display.tokens.blur}px
      </div>
    </div>
  );
}