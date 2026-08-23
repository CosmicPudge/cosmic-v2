import type { DiagnosticScan, VehicleConnection, VehicleConnectionProviderKind, VehicleTelemetrySnapshot } from "@/core/contracts/Garage";

export interface ConnectedVehicleProvider {
  kind: VehicleConnectionProviderKind;
  connect(vehicleId: string): Promise<VehicleConnection>;
  disconnect(connectionId: string): Promise<void>;
  readDiagnostics(connection: VehicleConnection): Promise<DiagnosticScan>;
  readTelemetry?(connection: VehicleConnection): Promise<VehicleTelemetrySnapshot>;
}

export interface ObdTransport {
  kind: "bluetooth-classic" | "ble" | "wifi" | "future-cosmic";
  open(): Promise<void>;
  send(command: string): Promise<string>;
  close(): Promise<void>;
}

export interface ObdProtocolAdapter {
  protocol: "elm327" | "stn" | "future";
  readVin(transport: ObdTransport): Promise<string | undefined>;
  readDiagnosticCodes(transport: ObdTransport): Promise<DiagnosticScan>;
  readSupportedPids(transport: ObdTransport): Promise<string[]>;
  readTelemetry?(transport: ObdTransport, pids: string[]): Promise<VehicleTelemetrySnapshot>;
}
