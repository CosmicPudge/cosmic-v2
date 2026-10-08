"use client";

import { CosmicIcon } from "@/components/cosmic-icons";

function normalizeSceneLabel(value: string) {
  return value.replace(/^(?:COSMIC|COSMOS)\\s*•\\s*/i, "");
}

export default function KioskSceneIdentity({ sceneLabel, variant = "overlay" }: { sceneLabel?: string; variant?: "overlay" | "inline" }) {
  return (
    <div className={`kiosk-scene-identity kiosk-scene-identity-${variant}`}>
      <CosmicIcon icon="cosmic-ai" size={variant === "overlay" ? 18 : 16} glow="purple" label="" />
      <span className="kiosk-scene-identity-brand">COSMOS</span>
      {sceneLabel ? <><span className="kiosk-scene-identity-separator" aria-hidden="true">•</span><span className="kiosk-scene-identity-label">{normalizeSceneLabel(sceneLabel)}</span></> : null}
    </div>
  );
}
