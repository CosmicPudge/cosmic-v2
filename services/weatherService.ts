export interface HourlyForecast {
  time: string;
  temp: number;
}

export interface WeatherData {
  city: string;

  temp: number;
  feelsLike: number;

  high: number;
  low: number;

  humidity: number;
  wind: number;

  condition: string;
  description: string;

  hourlyForecast: HourlyForecast[];

  lastUpdated: string;
}

export async function getWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const response = await fetch(
    `/api/weather?lat=${lat}&lon=${lon}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather.");
  }

  return response.json();
}