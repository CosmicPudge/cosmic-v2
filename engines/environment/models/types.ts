export interface HourlyForecast {
  time: string;
  temp: number;
  icon: string;
  precipitationChance: number;
  windSpeed: number;
  humidity: number;
  cloudCover: number;
}

export interface DailyForecast {
  day: string;
  high: number;
  low: number;
  icon: string;
  precipitationChance: number;
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

  // 👇 Add it here
  dailyForecast: DailyForecast[];

  lastUpdated: string;
}