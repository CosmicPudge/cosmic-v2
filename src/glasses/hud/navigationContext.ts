import type { CosmicNavigationResponse } from "../data/navigationClient";
import {
  buildNavigationPresentation,
  formatNavigationContext,
  formatNavigationDistance,
  relativeBearing,
  normalizeHeading,
  type NavigationPresentation,
} from "./navigationPresentation.ts";

export {
  buildNavigationPresentation,
  formatNavigationContext,
  formatNavigationDistance,
  normalizeHeading,
  relativeBearing,
};

export const NAVIGATION_CONTEXT_DISTANCE_METERS = 800;

function responseFor(
  type: string | null | undefined,
  modifier: string | null | undefined,
  distanceMeters = 0,
  targetBearing: number | null = null,
): CosmicNavigationResponse {
  return {
    navigation: {
      destination: "",
      etaMinutes: 0,
      distanceMiles: 0,
      traffic: "light",
      arrivalTime: null,
      nextManeuver: {
        instruction: "",
        type: type ?? "unknown",
        modifier,
        streetName: null,
        distanceMeters,
        targetBearing,
      },
    },
  };
}

export function getNavigationManeuverLabel(
  type: string | null | undefined,
  modifier: string | null | undefined,
) {
  return buildNavigationPresentation(responseFor(type, modifier)).label;
}

export function getNavigationArrow(
  type: string | null | undefined,
  modifier: string | null | undefined,
  bearing: number | null = null,
) {
  return buildNavigationPresentation(responseFor(type, modifier, 0, bearing)).arrow;
}

export function shouldUseLargeNavigationArrow(
  distanceMeters: number,
  type: string | null | undefined,
  modifier: string | null | undefined,
) {
  const presentation = buildNavigationPresentation(responseFor(type, modifier, distanceMeters));
  return presentation.distanceMeters !== null &&
    presentation.distanceMeters <= 250 &&
    presentation.arrow !== null;
}

export function formatUrgentNavigationContext(
  response: CosmicNavigationResponse,
  deviceHeading: number | null = null,
) {
  return formatNavigationContext(buildNavigationPresentation(response, deviceHeading));
}

export type { NavigationPresentation };
