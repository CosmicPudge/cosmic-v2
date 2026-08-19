import type {
  NavigationManeuver,
  NavigationManeuverType,
  NavigationSnapshot,
} from "@/core/contracts";

import type {
  NavigationProvider,
  NavigationRouteRequest,
} from "./types";

type MapboxManeuver = {
  instruction?: string;
  type?: string;
  modifier?: string;
  location?: [number, number];
};

type MapboxStep = {
  distance?: number;
  duration?: number;
  name?: string;
  maneuver?: MapboxManeuver;
};

type MapboxLeg = {
  duration?: number;
  distance?: number;
  steps?: MapboxStep[];
};

type MapboxRoute = {
  duration?: number;
  distance?: number;
  legs?: MapboxLeg[];
};

type MapboxResponse = {
  routes?: MapboxRoute[];
};

function normalizeManeuverType(
  type?: string,
): NavigationManeuverType {
  switch (type) {
    case "depart":
      return "depart";

    case "continue":
    case "new name":
      return "continue";

    case "turn":
    case "end of road":
      return "turn";

    case "merge":
      return "merge";

    case "fork":
      return "fork";

    case "roundabout":
    case "rotary":
    case "roundabout turn":
      return "roundabout";

    case "arrive":
      return "arrive";

    default:
      return "unknown";
  }
}

export class MapboxNavigationProvider
  implements NavigationProvider
{
  async getRoute(
    request: NavigationRouteRequest,
  ): Promise<NavigationSnapshot> {
    const token =
      process.env.MAPBOX_ACCESS_TOKEN;

    if (!token) {
      throw new Error(
        "MAPBOX_ACCESS_TOKEN is not configured.",
      );
    }

    const coordinates =
      `${request.origin.lon},${request.origin.lat};` +
      `${request.destination.lon},${request.destination.lat}`;

    const url =
      `https://api.mapbox.com/directions/v5/` +
      `mapbox/driving-traffic/${coordinates}` +
      `?steps=true` +
      `&overview=false` +
      `&geometries=geojson` +
      `&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Mapbox Directions returned ${response.status}.`,
      );
    }

    const data =
      (await response.json()) as MapboxResponse;

    const route =
      data.routes?.[0];

    const leg =
      route?.legs?.[0];

    if (!route || !leg) {
      throw new Error(
        "Mapbox returned no usable route.",
      );
    }

    const steps =
      leg.steps ?? [];

    /*
     * Mapbox typically returns:
     *
     * steps[0]
     * = current/depart segment
     *
     * steps[1]
     * = next actual maneuver
     *
     * The distance on steps[0] is therefore
     * a much better approximation of
     * "distance until next maneuver".
     */
    const currentStep =
      steps[0];

    const upcomingStep =
      steps[1] ?? steps[0];

    let nextManeuver:
      | NavigationManeuver
      | undefined;

    if (
      upcomingStep?.maneuver &&
      upcomingStep.maneuver.location
    ) {
      const [lon, lat] =
        upcomingStep.maneuver.location;

      nextManeuver = {
        instruction:
          upcomingStep.maneuver
            .instruction ??
          "Continue",

        type:
          normalizeManeuverType(
            upcomingStep.maneuver.type,
          ),

        modifier:
          upcomingStep.maneuver
            .modifier,

        streetName:
          upcomingStep.name ||
          undefined,

        // This now means distance UNTIL
        // the upcoming maneuver.
        distanceMeters:
          currentStep?.distance ?? 0,

        location: {
          lat,
          lon,
        },
      };
    }

    const durationSeconds =
      route.duration ?? 0;

    const distanceMeters =
      route.distance ?? 0;

    const now =
      new Date();

    const arrivalTime =
      new Date(
        now.getTime() +
          durationSeconds * 1000,
      );

    return {
      destination:
        request.destinationName,

      origin:
        request.origin,

      destinationLocation:
        request.destination,

      etaMinutes:
        Math.max(
          1,
          Math.round(
            durationSeconds / 60,
          ),
        ),

      distanceMiles:
        Number(
          (
            distanceMeters /
            1609.344
          ).toFixed(1),
        ),

      traffic: "light",

      departureTime: now,

      arrivalTime,

      routeReady: true,

      navigating: true,

      nextManeuver,

      remainingManeuvers:
        Math.max(
          0,
          steps.length - 1,
        ),

      lastUpdated: now,
    };
  }
}