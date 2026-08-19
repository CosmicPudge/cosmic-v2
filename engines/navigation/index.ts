import type { Engine } from "@/core/contracts/Engine";
import type {
  NavigationCoordinate,
  NavigationSnapshot,
} from "@/core/contracts";

import { MapboxNavigationProvider } from "@/services/navigation/mapbox";

type ActiveRoute = {
  origin: NavigationCoordinate;
  destination: NavigationCoordinate;
  destinationName: string;
};

export class NavigationEngine
  implements Engine<NavigationSnapshot>
{
  private provider =
    new MapboxNavigationProvider();

  private activeRoute: ActiveRoute | null =
    null;

  private snapshot:
    | NavigationSnapshot
    | null = null;

  private ready = false;

  private lastUpdated:
    | Date
    | null = null;

  async initialize(): Promise<void> {
    this.ready = true;
  }

  async refresh(): Promise<void> {
    if (!this.activeRoute) {
      return;
    }

    this.snapshot =
      await this.provider.getRoute({
        origin:
          this.activeRoute.origin,

        destination:
          this.activeRoute.destination,

        destinationName:
          this.activeRoute.destinationName,
      });

    this.lastUpdated =
      new Date();

    this.ready = true;
  }

  async getSnapshot(): Promise<NavigationSnapshot> {
    if (!this.ready) {
      await this.initialize();
    }

    if (!this.snapshot) {
      return {
        destination: "",
        etaMinutes: 0,
        distanceMiles: 0,
        traffic: "light",
        routeReady: false,
        navigating: false,
        lastUpdated:
          this.lastUpdated ?? undefined,
      };
    }

    return this.snapshot;
  }

  async startNavigation(
    origin: NavigationCoordinate,
    destination: NavigationCoordinate,
    destinationName: string,
  ): Promise<NavigationSnapshot> {
    this.activeRoute = {
      origin,
      destination,
      destinationName,
    };

    await this.refresh();

    return this.getSnapshot();
  }

  async updateOrigin(
    origin: NavigationCoordinate,
  ): Promise<NavigationSnapshot> {
    if (!this.activeRoute) {
      throw new Error(
        "No active navigation route.",
      );
    }

    this.activeRoute = {
      ...this.activeRoute,
      origin,
    };

    await this.refresh();

    return this.getSnapshot();
  }

  stopNavigation(): void {
    this.activeRoute = null;

    this.snapshot = {
      destination: "",
      etaMinutes: 0,
      distanceMiles: 0,
      traffic: "light",
      routeReady: false,
      navigating: false,
      lastUpdated: new Date(),
    };

    this.lastUpdated =
      new Date();
  }

  isReady(): boolean {
    return this.ready;
  }

  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }
}