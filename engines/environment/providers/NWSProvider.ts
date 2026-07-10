export async function getWeatherAlerts(
  lat: number,
  lon: number
) {
  const response = await fetch(
    `https://api.weather.gov/alerts/active?point=${lat},${lon}`,
    {
      headers: {
        "User-Agent": "Cosmic Weather",
        Accept: "application/geo+json",
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.features;
}