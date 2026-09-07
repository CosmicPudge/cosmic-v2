import type { NavigationPresentation } from "../glasses/hud/navigationPresentation";

export type PhoneNavigationVisual = {
  translateX: number;
  yawDegrees: number;
  rollDegrees: number;
  scale: number;
  behind: boolean;
};

export const PHONE_FIXTURE_BEARING_PRESETS = [
  { label: "STRAIGHT", heading: 0, target: 0 },
  { label: "SLIGHT LEFT", heading: 0, target: 315 },
  { label: "LEFT", heading: 0, target: 270 },
  { label: "HARD LEFT", heading: 0, target: 225 },
  { label: "SLIGHT RIGHT", heading: 0, target: 45 },
  { label: "RIGHT", heading: 0, target: 90 },
  { label: "HARD RIGHT", heading: 0, target: 135 },
  { label: "BEHIND", heading: 0, target: 180 },
] as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function getPhoneNavigationVisual(
  presentation: NavigationPresentation,
): PhoneNavigationVisual {
  const bearing = presentation.relativeBearing ?? 0;
  const distance = presentation.distanceMeters;
  const isNow = presentation.distanceText === "NOW";
  const scale = !presentation.visible
    ? 0
    : isNow
      ? 1.28
      : distance !== null && distance <= 60
        ? 1.12
        : presentation.urgency === "critical"
          ? 1.02
          : presentation.urgency === "arrow"
            ? 0.9
            : 0.72;

  return {
    translateX: clamp(bearing * 2.4, -210, 210),
    yawDegrees: presentation.behind
      ? bearing >= 0 ? 68 : -68
      : clamp(bearing * 0.62, -72, 72),
    rollDegrees: presentation.behind ? 0 : clamp(bearing * 0.18, -18, 18),
    scale,
    behind: presentation.behind,
  };
}
