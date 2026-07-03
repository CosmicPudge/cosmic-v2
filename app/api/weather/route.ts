import { getEnvironment } from "@/engines/environment";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return Response.json(
      {
        error: "Missing coordinates",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const weather = await getEnvironment(
      Number(lat),
      Number(lon)
    );

    return Response.json(weather);
  } catch (error) {
    console.error("Environment Engine Error:", error);

    return Response.json(
      {
        error: "Failed to fetch weather.",
      },
      {
        status: 500,
      }
    );
  }
}