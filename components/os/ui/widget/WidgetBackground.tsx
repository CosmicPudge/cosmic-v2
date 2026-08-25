"use client";

import { useDisplay } from "@/components/os/display";

import type { WidgetAccent } from "./types";
import { getModuleVisualIdentity } from "./moduleVisualIdentity";

interface Props {
  accent: WidgetAccent;
}

export default function WidgetBackground({
  accent,
}: Props) {
  const { tokens } = useDisplay();
  const visual = getModuleVisualIdentity(accent);

  return (
    <>
      {/* Main Accent */}
      <div className="cosmic-widget-panel absolute inset-0" style={{ background: "var(--widget-panel, linear-gradient(145deg, rgba(10,17,39,.96), rgba(3,7,21,.92))" }} />
      <div className={`cosmic-widget-motif cosmic-widget-motif-${visual.motif} absolute inset-0`} aria-hidden="true" />

      {/* Light Bloom */}
      <div
        className="
          absolute
          -left-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-[color:var(--widget-accent)]
        "
        style={{
          filter: `blur(${tokens.blur * 2}px)`,
        }}
      />

      {/* Secondary Glow */}
      <div
        className="
          absolute
          bottom-0
          right-0
          h-56
          w-56
          rounded-full
          bg-[color:var(--widget-secondary)]
        "
        style={{
          filter: `blur(${tokens.blur * 2}px)`,
        }}
      />

      {/* Ambient Highlight */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-b
          from-white/[0.08]
          via-transparent
          to-transparent
        "
      />

      {/* Bottom Shadow */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/10
          via-transparent
          to-transparent
        "
      />
    </>
  );
}
