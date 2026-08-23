import type { CosmicEntitlements } from "@/core/contracts/Entitlements";
import type { Vehicle, VehicleStatus } from "@/core/contracts/Garage";

const activeStatuses: VehicleStatus[] = ["active", "maintenance", "stored", "project", "out_of_service"];

export function isActiveVehicleStatus(status: VehicleStatus): boolean {
  return activeStatuses.includes(status);
}

export function normalizeVehicleLifecycle(vehicle: Vehicle): Vehicle {
  return vehicle.status === "project" ? { ...vehicle, status: "active", classification: vehicle.classification ?? "project" } : vehicle;
}

export function countActiveVehicles(vehicles: Vehicle[]): number {
  return vehicles.filter((vehicle) => isActiveVehicleStatus(vehicle.status)).length;
}

export function canAddActiveVehicle(vehicles: Vehicle[], entitlements: CosmicEntitlements, existing?: Vehicle): boolean {
  const limit = entitlements.limits["garage.activeVehicles"];
  if (limit === null || (existing && isActiveVehicleStatus(existing.status))) return true;
  return countActiveVehicles(vehicles) < limit;
}

export function getGarageVehicleLimitState(vehicles: Vehicle[], entitlements: CosmicEntitlements) {
  const active = countActiveVehicles(vehicles);
  const limit = entitlements.limits["garage.activeVehicles"];
  return { active, limit, atLimit: limit !== null && active >= limit, overLimit: limit !== null && active > limit };
}
