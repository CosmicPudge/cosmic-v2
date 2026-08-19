import type {
  NavigationCoordinate,
  NavigationSnapshot,
} from "@/core/contracts";

export interface NavigationRouteRequest {
  origin: NavigationCoordinate;

  destination: NavigationCoordinate;

  destinationName: string;
}

export interface NavigationProvider {
  getRoute(
    request: NavigationRouteRequest,
  ): Promise<NavigationSnapshot>;
}
