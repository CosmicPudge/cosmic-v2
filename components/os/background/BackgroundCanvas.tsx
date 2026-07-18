// BackgroundCanvas.tsx
"use client";

import { useEffect, useRef } from "react";
import { CanvasRenderer } from "./CanvasRenderer";

export default function BackgroundCanvas() {
  const canvasReference = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasReference.current;

    if (canvas === null) {
      return;
    }

    const renderer = new CanvasRenderer(canvas);

    const resizeCanvas = (): void => {
      const bounds = canvas.getBoundingClientRect();
      renderer.resize(bounds.width, bounds.height, window.devicePixelRatio);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);

    resizeCanvas();
    resizeObserver.observe(canvas);
    window.addEventListener("resize", resizeCanvas);
    renderer.start();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      resizeObserver.disconnect();
      renderer.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasReference}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "block",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}