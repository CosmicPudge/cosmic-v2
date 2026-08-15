"use client";

import { useEffect, useRef } from "react";

import {
  CanvasRenderer,
  type CanvasRendererOptions,
} from "./CanvasRenderer";

export default function BackgroundCanvas({
  variant = "dashboard",
  intensity = "normal",
  motion = "normal",
  timeOverrideSeconds,
  debug = false,
  reducedMotion = false,
}: CanvasRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      renderer.resize(
        bounds.width,
        bounds.height,
        Math.min(window.devicePixelRatio || 1, 2),
      );
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        renderer.stop();
      } else {
        resize();
        renderer.start();
      }
    };
    const observer = new ResizeObserver(resize);

    observer.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resize();
    renderer.start();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.updateOptions({
      variant,
      intensity,
      motion,
      timeOverrideSeconds,
      debug,
      reducedMotion,
    });
  }, [debug, intensity, motion, reducedMotion, timeOverrideSeconds, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
