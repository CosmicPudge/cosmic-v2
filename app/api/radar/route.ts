import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.rainviewer.com/public/weather-maps.json",
      {
        next: {
          revalidate: 120,
        },
      }
    );

    if (!response.ok) {
      throw new Error("RainViewer unavailable");
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch radar." },
      { status: 500 }
    );
  }
}