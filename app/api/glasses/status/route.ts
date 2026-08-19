import { NextResponse } from "next/server";

import { getEnvironment } from "@/engines/environment";

export const dynamic = "force-dynamic";

// Temporary default location for Glasses development.
// Later, this will come from the phone/device location.
const DEFAULT_LAT = 41.0171;
const DEFAULT_LON = -111.4985;

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat =
    Number(searchParams.get("lat")) ||
    DEFAULT_LAT;

  const lon =
    Number(searchParams.get("lon")) ||
    DEFAULT_LON;

  try {
    const environment = await getEnvironment(
      lat,
      lon,
    );

    return NextResponse.json(
      {
        device: {
          mode: "glasses",
          connected: true,
        },

        location: {
          city: environment.city,
          lat: environment.lat,
          lon: environment.lon,
        },

        weather: {
          temperature: environment.temp,
          feelsLike: environment.feelsLike,
          condition: environment.condition,
          description: environment.description,
          icon: environment.icon,
        },

        timestamp: new Date().toISOString(),
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Glasses Status Environment Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load Cosmic Glasses status.",
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