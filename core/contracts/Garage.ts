export interface VehicleSnapshot {
  id: string;

  name: string;

  make: string;

  model: string;

  year: number;

  fuelPercent?: number;

  estimatedRange?: number;

  mileage?: number;

  maintenanceDue?: string;

  tirePressure?: number[];

  batteryVoltage?: number;

  connected: boolean;
}