import { getWeather } from "@/services/weatherService";

import type { WeatherData } from "@/engines/environment";
import type { Engine } from "@/core/contracts/Engine";

export interface WeatherConfig {
  lat: number;
  lon: number;
}

export class WeatherEngine
  implements Engine<WeatherData, WeatherConfig>
{
  private snapshot: WeatherData | null = null;

  private lastUpdated: Date | null = null;

  private ready = false;

  private config: WeatherConfig | null = null;

  async initialize(config?: WeatherConfig, signal?: AbortSignal): Promise<void> {
    if (!config) {
      throw new Error("WeatherEngine requires a WeatherConfig.");
    }

    this.config = config;

    await this.refresh(signal);
  }

  async refresh(signal?: AbortSignal): Promise<void> {
    if (!this.config) {
      throw new Error("WeatherEngine has not been initialized.");
    }

    const weather = await getWeather(this.config.lat, this.config.lon, signal);

    this.snapshot = weather;

    this.lastUpdated = new Date();

    this.ready = true;
  }

  async getSnapshot(): Promise<WeatherData> {
    if (!this.snapshot) {
      throw new Error("Weather has not been loaded.");
    }

    return this.snapshot;
  }

  isReady(): boolean {
    return this.ready;
  }

  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }
}
