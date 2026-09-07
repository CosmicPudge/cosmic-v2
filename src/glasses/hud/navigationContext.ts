import type {
  CosmicNavigationResponse,
} from "../data/navigationClient";

export const NAVIGATION_CONTEXT_DISTANCE_METERS = 800;

const MAX_NAVIGATION_CONTEXT_LENGTH = 25;

function truncateNavigationContext(content: string) {
  return content.length > MAX_NAVIGATION_CONTEXT_LENGTH
    ? `${content.slice(0, MAX_NAVIGATION_CONTEXT_LENGTH - 1)}…`
    : content;
}

export function formatNavigationDistance(meters: number) {
  if (!Number.isFinite(meters) || meters < 0) {
    return "";
  }

  const feet = meters * 3.28084;

  if (feet <= 80) {
    return "NOW";
  }

  if (feet < 1000) {
    return `${Math.round(feet / 10) * 10} ft`;
  }

  const miles = meters / 1609.344;
  if (miles < 0.5) {
    return `${Math.round(feet / 50) * 50} ft`;
  }

  return `${miles.toFixed(1)} mi`;
}

export function getNavigationManeuverLabel(
  type: string | null | undefined,
  modifier: string | null | undefined,
) {
  const normalizedType = type?.trim().toLowerCase() ?? "";
  const normalizedModifier = modifier?.trim().toLowerCase() ?? "";

  if (normalizedType.includes("arriv")) {
    return "ARRIVE";
  }

  if (normalizedType.includes("exit")) {
    return "EXIT";
  }

  if (["left", "slight left", "sharp left"].includes(normalizedModifier)) {
    return "TURN LEFT";
  }

  if (["right", "slight right", "sharp right"].includes(normalizedModifier)) {
    return "TURN RIGHT";
  }

  if (normalizedModifier === "straight") {
    return "CONTINUE";
  }

  if (normalizedModifier === "uturn") {
    return "U-TURN";
  }

  return "NAVIGATION";
}

// These are the conservative screen-fixed glyphs used by the large card.
// The EvenHub SDK does not publish a hardware glyph matrix, so U-turns and
// unknown maneuvers deliberately fall back to the existing text treatment.
export function getNavigationArrow(
  type: string | null | undefined,
  modifier: string | null | undefined,
) {
  const normalizedType = type?.trim().toLowerCase() ?? "";
  const normalizedModifier = modifier?.trim().toLowerCase() ?? "";

  if (normalizedType.includes("arriv")) return "◎";
  if (normalizedModifier === "straight") return "↑";
  if (normalizedModifier === "slight right") return "↗";
  if (normalizedModifier === "right") return "→";
  if (normalizedModifier === "sharp right") return "↘";
  if (normalizedModifier === "slight left") return "↖";
  if (normalizedModifier === "left") return "←";
  if (normalizedModifier === "sharp left") return "↙";

  return null;
}

export function shouldUseLargeNavigationArrow(
  distanceMeters: number,
  type: string | null | undefined,
  modifier: string | null | undefined,
) {
  return Number.isFinite(distanceMeters) &&
    distanceMeters >= 0 &&
    distanceMeters <= 250 &&
    getNavigationArrow(type, modifier) !== null;
}

export function formatUrgentNavigationContext(
  response: CosmicNavigationResponse,
) {
  const maneuver = response.navigation?.nextManeuver;
  if (!maneuver || !Number.isFinite(maneuver.distanceMeters)) {
    return "";
  }

  if (
    maneuver.distanceMeters < 0 ||
    maneuver.distanceMeters > NAVIGATION_CONTEXT_DISTANCE_METERS
  ) {
    return "";
  }

  const distance = formatNavigationDistance(maneuver.distanceMeters);
  if (!distance) {
    return "";
  }

  return truncateNavigationContext(
    `${getNavigationManeuverLabel(maneuver.type, maneuver.modifier)} • ${distance}`,
  );
}
