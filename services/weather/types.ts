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