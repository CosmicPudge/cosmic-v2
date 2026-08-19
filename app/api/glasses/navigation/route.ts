import { NextResponse } from "next/server";

import { navigation } from "@/core/navigation";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function buildNavigationResponse(
  snapshot: Awaited<
    ReturnType<typeof navigation.getSnapshot>
  >,
) {
  if (
    !snapshot.routeReady ||
    !snapshot.navigating
  ) {
    return {
      navigation: null,
    };
  }

  return {
    navigation: {
      destination:
        snapshot.destination,

      etaMinutes:
        snapshot.etaMinutes,

      distanceMiles:
        snapshot.distanceMiles,

      traffic:
        snapshot.traffic,

      arrivalTime:
        snapshot.arrivalTime ?? null,

      nextManeuver:
        snapshot.nextManeuver
          ? {
              instruction:
                snapshot.nextManeuver.instruction,

              type:
                snapshot.nextManeuver.type,

              modifier:
                snapshot.nextManeuver.modifier ?? null,

              streetName:
                snapshot.nextManeuver.streetName ?? null,

              distanceMeters:
                snapshot.nextManeuver.distanceMeters,
            }
          : null,
    },
  };
}

export async function GET() {
  try {
    const snapshot =
      await navigation.getSnapshot();

    return NextResponse.json(
      buildNavigationResponse(snapshot),
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Glasses Navigation Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load Cosmic Glasses navigation.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function PATCH(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as {
        lat?: number;
        lon?: number;
      };

    if (
      typeof body.lat !== "number" ||
      typeof body.lon !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "lat and lon are required.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const snapshot =
      await navigation.updateOrigin({
        lat: body.lat,
        lon: body.lon,
      });

    return NextResponse.json(
      buildNavigationResponse(snapshot),
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Glasses Navigation Update Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update navigation location.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
