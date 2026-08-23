const API_KEY = process.env.OPENWEATHER_API_KEY!;

export async function getOpenWeatherAirQuality(
  lat: number,
  lon: number
) {
  const url = new URL("https://api.openweathermap.org/data/2.5/air_pollution");
  url.search = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: API_KEY }).toString();
  const response = await fetch(url, { redirect: "error", cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch air quality.");
  }

  const data = await response.json();

  const air = data.list[0];

  return {
    aqi: air.main.aqi,

    pm25: air.components.pm2_5,

    pm10: air.components.pm10,

    ozone: air.components.o3,

    no2: air.components.no2,

    co: air.components.co,
  };
}
