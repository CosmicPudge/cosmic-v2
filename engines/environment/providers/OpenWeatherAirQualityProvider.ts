const API_KEY = process.env.OPENWEATHER_API_KEY!;

export async function getOpenWeatherAirQuality(
  lat: number,
  lon: number
) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );

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