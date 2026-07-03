import type {
  DailyForecast,
  HourlyForecast,
} from "../models/types";

export async function getOpenMeteo(
  lat: number,
  lon: number
): Promise<{
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
}> {

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,cloud_cover,precipitation_probability,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
  );

  if (!response.ok) {
    throw new Error("Open-Meteo request failed.");
  }

  const data = await response.json();

  console.log(data);

  const hourlyForecast = data.hourly.time
  .slice(0, 12)
  .map((time: string, index: number) => ({
    time: new Date(time).toLocaleTimeString([], {
      hour: "numeric",
    }),

    temp: Math.round(
      data.hourly.temperature_2m[index]
    ),

    icon: "01d",

    precipitationChance:
      data.hourly.precipitation_probability[index],

    windSpeed:
      Math.round(
        data.hourly.wind_speed_10m[index]
      ),

    humidity:
      data.hourly.relative_humidity_2m[index],

    cloudCover:
      data.hourly.cloud_cover[index],
  }));

const dailyForecast = data.daily.time
  .slice(0, 7)
  .map((day: string, index: number) => ({
    day: new Date(day).toLocaleDateString([], {
      weekday: "short",
    }),

    high:
      Math.round(
        data.daily.temperature_2m_max[index]
      ),

    low:
      Math.round(
        data.daily.temperature_2m_min[index]
      ),

    icon: "01d",

    precipitationChance:
      data.daily.precipitation_probability_max[index],
  }));

return {
  hourlyForecast,
  dailyForecast,
};
}