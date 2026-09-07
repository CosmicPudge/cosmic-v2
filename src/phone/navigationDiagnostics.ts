import {
  normalizeHeading,
  type NavigationPresentation,
} from "../glasses/hud/navigationPresentation.ts";

export type PhoneNavigationDiagnostics = {
  mode: "real" | "fixture";
  heading: string;
  target: string;
  relative: string;
  distance: string;
};

function formatHeading(value: number | null): string {
  return Number.isFinite(value)
    ? `${Math.round(normalizeHeading(value as number))}°`
    : "UNAVAILABLE";
}

function formatTarget(value: number | null): string {
  return Number.isFinite(value)
    ? `${Math.round(normalizeHeading(value as number))}°`
    : "UNAVAILABLE";
}

function formatRelative(value: number | null): string {
  if (!Number.isFinite(value)) return "UNAVAILABLE";
  const rounded = Math.round(value as number);
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

export function formatPhoneNavigationDiagnostics(
  mode: "real" | "fixture",
  heading: number | null,
  presentation: NavigationPresentation,
): PhoneNavigationDiagnostics {
  return {
    mode,
    heading: formatHeading(heading),
    target: formatTarget(presentation.targetBearing),
    relative: formatRelative(presentation.relativeBearing),
    distance: presentation.distanceText || "UNAVAILABLE",
  };
}
