import { NextResponse } from "next/server";

import { navigation } from "@/core/navigation";

export const dynamic = "force-dynamic";

type StartNavigationBody = {
  origin?: {
    lat?: number;
    lon?: number;
  };

  destination?: {
    lat?: number;
    lon?: number;
  };

  destinationName?: string;
};

type UpdateNavigationBody = {
  lat?: number;
  lon?: number;
};

// --------------------------------------------------
// GET CURRENT NAVIGATION
// --------------------------------------------------

export async function GET() {
  try {
    const snapshot =
      await navigation.getSnapshot();

    return NextResponse.json(
      snapshot,
    );
  } catch (error) {
    console.error(
      "Navigation snapshot error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Navigation is temporarily unavailable.",
      },
      {
        status: 500,
      },
    );
  }
}

// --------------------------------------------------
// START NAVIGATION
// --------------------------------------------------

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as StartNavigationBody;

    const origin =
      body.origin;

    const destination =
      body.destination;

    const destinationName =
      body.destinationName?.trim();

    if (
      typeof origin?.lat !== "number" ||
      typeof origin?.lon !== "number" ||
      typeof destination?.lat !== "number" ||
      typeof destination?.lon !== "number" ||
      !destinationName
    ) {
      return NextResponse.json(
        {
          error:
            "Origin, destination, and destinationName are required.",
        },
        {
          status: 400,
        },
      );
    }

    const snapshot =
      await navigation.startNavigation(
        {
          lat: origin.lat,
          lon: origin.lon,
        },
        {
          lat: destination.lat,
          lon: destination.lon,
        },
        destinationName,
      );

    return NextResponse.json(
      snapshot,
    );
  } catch (error) {
    console.error(
      "Navigation start error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to start navigation.",
      },
      {
        status: 500,
      },
    );
  }
}

// --------------------------------------------------
// UPDATE CURRENT POSITION
// --------------------------------------------------

export async function PATCH(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as UpdateNavigationBody;

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
        },
      );
    }

    const snapshot =
      await navigation.updateOrigin({
        lat: body.lat,
        lon: body.lon,
      });

    return NextResponse.json(
      snapshot,
    );
  } catch (error) {
    console.error(
      "Navigation location update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update navigation location.",
      },
      {
        status: 500,
      },
    );
  }
}

// --------------------------------------------------
// STOP NAVIGATION
// --------------------------------------------------

export async function DELETE() {
  navigation.stopNavigation();

  return NextResponse.json({
    stopped: true,
  });
}