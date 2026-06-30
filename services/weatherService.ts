export interface HourlyForecast {
  time: string;
  temp: number;
}

export interface WeatherData {
  city: string;

  icon: string;

  temp: number;
  feelsLike: number;

  high: number;
  low: number;

  humidity: number;
  windSpeed: number;
windDirection: number;
precipitation24h: number;

  condition: string;
  description: string;

  sunrise: number;
  sunset: number;

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