import { getEnvironment } from "@/engines/environment";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!lat || !lon || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
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
    const weather = await getEnvironment(latitude, longitude);

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
