"use client";

import { useMemo, type CSSProperties } from "react";

import CosmicIconBadge from "./CosmicIconBadge";
import CosmicIconGlow from "./CosmicIconGlow";
import CosmicIconShell from "./CosmicIconShell";
import CosmicGlyph from "./glyphs/CosmicGlyph";
import { useCosmicIconMotion } from "./hooks/useCosmicIconMotion";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { cosmicIconRegistry, iconLabels } from "./registry";
import type { CosmicIconProps } from "./types";

export default function CosmicIcon({
  icon, size = 32, state = "idle", className = "", label, count, condition,
  trend, intensity = 0.72, live = false, playing = false, glow = "purple",
  interactive = false, onClick, style,
}: CosmicIconProps) {
  const reducedMotion = useReducedMotion();
  const continuous = state === "loading" || state === "live" || live || playing || icon === "syncing";
  const { ref, animate } = useCosmicIconMotion(continuous);
  void cosmicIconRegistry[icon];
  const accessibleLabel = label ?? iconLabels[icon];
  const isDecorative = !label && !interactive;
  const iconClass = useMemo(() => [
    "cosmic-icon-svg",
    `cosmic-icon-state-${state}`,
    `cosmic-icon-${icon}`,
    condition ? `cosmic-weather-${condition}` : "",
    trend ? `cosmic-trend-${trend}` : "",
    playing ? "cosmic-icon-playing" : "",
    live ? "cosmic-icon-live" : "",
    !animate || reducedMotion ? "cosmic-icon-paused" : "",
  ].filter(Boolean).join(" "), [animate, condition, icon, live, playing, reducedMotion, state, trend]);

  return (
    <CosmicIconShell
      ref={ref}
      size={size}
      glow={glow}
      interactive={interactive}
      onClick={onClick}
      className={className}
      style={{ "--cosmic-icon-intensity": intensity, ...style } as CSSProperties}
      aria-label={isDecorative ? undefined : accessibleLabel}
      aria-hidden={isDecorative ? true : undefined}
      title={interactive ? accessibleLabel : undefined}
    >
      <CosmicIconGlow />
      <span className="cosmic-icon-core" aria-hidden="true">
        <CosmicGlyph name={icon} condition={condition} active={state === "active" || state === "live"} className={iconClass} />
        {(icon === "music" && playing) || icon === "syncing" ? <span className="cosmic-icon-orbit" /> : null}
        {icon === "sports" && live ? <span className="cosmic-icon-broadcast" /> : null}
      </span>
      <CosmicIconBadge count={count} live={live} />
    </CosmicIconShell>
  );
}
