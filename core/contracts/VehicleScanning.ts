export type VehicleScanKind = "vin" | "plate";
export interface VehicleScanResult { kind: VehicleScanKind; value: string; region?: string; confidence?: number; source: "camera" | "simulated"; }
