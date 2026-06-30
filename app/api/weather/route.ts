export async function GET(request: Request) {
  const key = process.env.OPENWEATHER_API_KEY;

  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return Response.json({
      error: "Missing coordinates",
    });
  }

  // Current weather
  const currentResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=imperial`
  );

  const currentData = await currentResponse.json();

  // Forecast data
  const forecastResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=imperial`
  );

  const forecastData = await forecastResponse.json();
  console.log(forecastData);

  const todaysForecasts = forecastData.list.slice(0, 8);

const high = Math.round(
  Math.max(...todaysForecasts.map((item: any) => item.main.temp_max))
);

const low = Math.round(
  Math.min(...todaysForecasts.map((item: any) => item.main.temp_min))
);

  const hourlyForecast = forecastData.list
    .slice(0, 5)
    .map((item: any) => ({
      time: new Date(item.dt * 1000).toLocaleTimeString([], {
        hour: "numeric",
      }),
      temp: Math.round(item.main.temp),
    }));

  return Response.json({
    lastUpdated:
  new Date().toISOString(),
  
    temp: Math.round(currentData.main.temp),

    feelsLike: Math.round(
      currentData.main.feels_like
    ),

    high,
    low,

    condition:
      currentData.weather[0].main,

    description:
      currentData.weather[0].description,

    humidity:
      currentData.main.humidity,

    wind: Math.round(
      currentData.wind.speed
    ),

    city: currentData.name,

    hourlyForecast,
  });
}