"use client";

import type { CSSProperties } from "react";
import type { SportsCelebration } from "./sportsCelebration";

export default function SportsCelebrationOverlay({ celebration }: { celebration: SportsCelebration | null }) {
  if (!celebration) return null;
  return (
    <div className={`kiosk-sports-celebration kiosk-sports-celebration-${celebration.kind}`} aria-live="polite" aria-label={celebration.label} style={{ "--celebration-primary": celebration.primaryColor, "--celebration-secondary": celebration.secondaryColor } as CSSProperties}>
      <div className="kiosk-sports-celebration-wash" />
      <strong>{celebration.label}</strong>
    </div>
  );
}
