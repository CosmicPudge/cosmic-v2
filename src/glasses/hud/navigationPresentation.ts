import type { CosmicNavigationResponse } from "../data/navigationClient";

export const NAVIGATION_CONTEXT_DISTANCE_METERS = 800;
export const NAVIGATION_ARROW_DISTANCE_METERS = 250;
export const NAVIGATION_CRITICAL_DISTANCE_METERS = 130;

export type NavigationDirectionClass =
  | "straight" | "slight-left" | "left" | "sharp-left"
  | "slight-right" | "right" | "sharp-right" | "uturn" | "arrive" | "unknown";

export type NavigationUrgency = "inactive" | "context" | "arrow" | "critical";

export type NavigationPresentation = {
  visible: boolean;
  maneuverType: string | null;
  modifier: string | null;
  relativeBearing: number | null;
  distanceMeters: number | null;
  urgency: NavigationUrgency;
  behind: boolean;
  passed: boolean;
  arrived: boolean;
  directionClass: NavigationDirectionClass;
  arrow: string | null;
  label: string;
  distanceText: string;
  streetName: string | null;
  instruction: string | null;
  targetBearing: number | null;
  deviceHeading: number | null;
};

export function normalizeHeading(heading: number): number {
  if (!Number.isFinite(heading)) return 0;
  return ((heading % 360) + 360) % 360;
}

export function relativeBearing(
  targetBearing: number | null | undefined,
  deviceHeading: number | null | undefined,
): number | null {
  if (!Number.isFinite(targetBearing) || !Number.isFinite(deviceHeading)) return null;
  let result = normalizeHeading(targetBearing as number) - normalizeHeading(deviceHeading as number);
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}

export function formatNavigationDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "";
  const feet = meters * 3.28084;
  if (feet <= 80) return "NOW";
  if (feet < 1000) return `${Math.round(feet / 10) * 10} ft`;
  const miles = meters / 1609.344;
  if (miles < 0.5) return `${Math.round(feet / 50) * 50} ft`;
  return `${miles.toFixed(1)} mi`;
}

function directionFromModifier(type: string | null | undefined, modifier: string | null | undefined): NavigationDirectionClass {
  const normalizedType = type?.trim().toLowerCase() ?? "";
  const normalizedModifier = modifier?.trim().toLowerCase() ?? "";
  if (normalizedType.includes("arriv")) return "arrive";
  if (normalizedModifier === "straight") return "straight";
  if (normalizedModifier === "slight left") return "slight-left";
  if (normalizedModifier === "left") return "left";
  if (normalizedModifier === "sharp left") return "sharp-left";
  if (normalizedModifier === "slight right") return "slight-right";
  if (normalizedModifier === "right") return "right";
  if (normalizedModifier === "sharp right") return "sharp-right";
  if (normalizedModifier === "uturn") return "uturn";
  return "unknown";
}

function directionFromBearing(bearing: number): NavigationDirectionClass {
  const absolute = Math.abs(bearing);
  if (absolute >= 150) return "uturn";
  if (absolute < 22.5) return "straight";
  if (bearing > 0 && absolute < 67.5) return "slight-right";
  if (bearing > 0 && absolute < 112.5) return "right";
  if (bearing > 0) return "sharp-right";
  if (absolute < 67.5) return "slight-left";
  if (absolute < 112.5) return "left";
  return "sharp-left";
}

function arrowForDirection(direction: NavigationDirectionClass): string | null {
  return {
    straight: "↑", "slight-left": "↖", left: "←", "sharp-left": "↙",
    "slight-right": "↗", right: "→", "sharp-right": "↘", arrive: "◎",
  }[direction] ?? null;
}

function labelForDirection(type: string | null, direction: NavigationDirectionClass): string {
  const normalizedType = type?.trim().toLowerCase() ?? "";
  if (normalizedType.includes("arriv") || direction === "arrive") return "ARRIVE";
  if (normalizedType.includes("exit")) return "EXIT";
  if (direction.includes("left")) return "TURN LEFT";
  if (direction.includes("right")) return "TURN RIGHT";
  if (direction === "straight") return "CONTINUE";
  if (direction === "uturn") return "U-TURN";
  return "NAVIGATION";
}

function emptyPresentation(): NavigationPresentation {
  return {
    visible: false, maneuverType: null, modifier: null, relativeBearing: null,
    distanceMeters: null, urgency: "inactive", behind: false, passed: false,
    arrived: false, directionClass: "unknown", arrow: null, label: "NAVIGATION",
    distanceText: "", streetName: null, instruction: null, targetBearing: null,
    deviceHeading: null,
  };
}

export function buildNavigationPresentation(
  response: CosmicNavigationResponse | null | undefined,
  deviceHeading: number | null = null,
): NavigationPresentation {
  const navigation = response?.navigation;
  const maneuver = navigation?.nextManeuver;
  if (!navigation || !maneuver) return emptyPresentation();
  const distanceMeters = maneuver.distanceMeters;
  const passed = Number.isFinite(distanceMeters) && distanceMeters < 0;
  const arrived = maneuver.type.toLowerCase().includes("arriv");
  if (!Number.isFinite(distanceMeters) || passed) return { ...emptyPresentation(), passed };

  const targetBearing = maneuver.targetBearing ?? null;
  const bearing = relativeBearing(targetBearing, deviceHeading);
  const directionClass = bearing === null
    ? directionFromModifier(maneuver.type, maneuver.modifier)
    : directionFromBearing(bearing);
  const arrow = arrowForDirection(directionClass);
  const visible = distanceMeters <= NAVIGATION_CONTEXT_DISTANCE_METERS;
  const urgency: NavigationUrgency = !visible
    ? "inactive"
    : distanceMeters <= NAVIGATION_CRITICAL_DISTANCE_METERS
      ? "critical"
      : distanceMeters <= NAVIGATION_ARROW_DISTANCE_METERS && arrow
        ? "arrow"
        : "context";

  return {
    visible, maneuverType: maneuver.type, modifier: maneuver.modifier,
    relativeBearing: bearing, distanceMeters, urgency,
    behind: bearing !== null && Math.abs(bearing) >= 150, passed: false, arrived,
    directionClass, arrow, label: labelForDirection(maneuver.type, directionClass),
    distanceText: formatNavigationDistance(distanceMeters),
    streetName: maneuver.streetName?.trim() || null, instruction: maneuver.instruction,
    targetBearing, deviceHeading: Number.isFinite(deviceHeading) ? deviceHeading : null,
  };
}

export function formatNavigationContext(presentation: NavigationPresentation): string {
  if (!presentation.visible || !presentation.distanceText) return "";
  const content = `${presentation.label} • ${presentation.distanceText}`;
  return content.length > 25 ? `${content.slice(0, 24)}…` : content;
}

export function shouldUseLargeNavigationArrow(presentation: NavigationPresentation): boolean {
  return presentation.urgency === "arrow" || presentation.urgency === "critical";
}
