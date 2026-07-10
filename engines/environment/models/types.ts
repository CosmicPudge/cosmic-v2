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
  date: string;
  high: number;
  low: number;
  icon: string;
  precipitationChance: number;
}

export interface AirQuality {
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  co: number;
}

export interface AstronomyData {
  moonPhase: number;

  moonPhaseName: string;

  illumination: number;

  moonrise: number;

  moonset: number;

  nextFullMoon: string;

  nextNewMoon: string;
}

export interface WeatherAlert {
  id: string;

  event: string;

  severity: string;

  headline: string;

  description: string;

  expires: string;
}

/*
|--------------------------------------------------------------------------
| OpenWeather Current Conditions
|--------------------------------------------------------------------------
*/

export interface CurrentWeather {
  city: string;
  lat: number;
  lon: number;
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
  daylightProgress: number;

  dayLength: string;

  lastUpdated: string;
}

/*
|--------------------------------------------------------------------------
| Open-Meteo Forecast
|--------------------------------------------------------------------------
*/

export interface ForecastData {
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
}

/*
|--------------------------------------------------------------------------
| Final Environment Model
|--------------------------------------------------------------------------
*/

export interface WeatherData extends CurrentWeather {
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  weatherAlerts: WeatherAlert[];
  sunrise: number;
  sunset: number;
  dayLength: string;
  daylightProgress: number;
  airQuality: AirQuality;
  lat: number;
  lon: number;
  astronomy: AstronomyData;
}