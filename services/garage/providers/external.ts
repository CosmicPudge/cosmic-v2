import type { GarageRepairEstimate, Vehicle } from "@/core/contracts/Garage";

export interface PlateLookupRequest { plate: string; region: string; country?: string; }
export interface PlateLookupResult { provider: string; plate: string; region: string; country: string; vin?: string; year?: string; make?: string; model?: string; trim?: string; vehicleType?: string; providerReference?: string; availability: "available" | "unavailable"; errorCode?: "not_found" | "invalid" | "rate_limited" | "unavailable" | "unconfigured"; }
export interface PlateLookupProvider { id: string; lookup(request: PlateLookupRequest): Promise<PlateLookupResult>; }

export interface RepairEstimateRequest { vehicle: Vehicle; category: string; region: string; issueId?: string; serviceId?: string; }
export interface RepairEstimateProvider { id: string; estimate(request: RepairEstimateRequest): Promise<GarageRepairEstimate>; }

export interface RepairShop { id: string; name: string; address?: string; distanceMiles?: number; rating?: number; reviewCount?: number; hours?: string[]; website?: string; phone?: string; services?: string[]; source: string; pricingAvailability: "published" | "provider-estimate" | "not-published"; }
export interface RepairShopProvider { id: string; findNearby(request: { query: string; latitude?: number; longitude?: number; radiusMeters?: number; service?: string }): Promise<RepairShop[]>; }
