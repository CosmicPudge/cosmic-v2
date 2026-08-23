export type VehicleStatus = "active" | "maintenance" | "stored" | "sold" | "retired" | "project" | "out_of_service" | "archived";
export type VehicleType = "car" | "truck" | "SUV" | "motorcycle" | "ATV/UTV" | "other";
export type MaintenancePriority = "low" | "medium" | "high";
export type MaintenanceStatus = "overdue" | "dueSoon" | "upcoming" | "notScheduled";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "monitoring" | "resolved";
export type ModificationCategory = "Performance" | "Suspension" | "Wheels/Tires" | "Exterior" | "Interior" | "Audio" | "Electrical" | "Other";
export type ExpenseCategory = "Fuel" | "Maintenance" | "Repair" | "Modification" | "Registration" | "Insurance" | "Other";
export type FuelGrade = "regular" | "midgrade" | "premium" | "diesel" | "e85" | "other";
export type GarageTimelineType = "purchase" | "sale" | "mileage" | "fuel" | "maintenance" | "service" | "issue" | "modification" | "reminder";
export type GarageCollectionKind = "personal" | "project" | "family" | "work" | "other";
export type VehicleClassification = "daily" | "project" | "track" | "work" | "other";
export type VehicleConnectionProviderKind = "manual" | "obd2" | "oem" | "future_cosmic_obd";
export type VehicleConnectionStatus = "connected" | "disconnected" | "error" | "unsupported";

export interface Vehicle { id: string; nickname: string; year: number; make: string; model: string; trim?: string; vehicleType?: VehicleType; vin?: string; vinSpecifications?: VehicleVinSpecifications; licensePlate?: string; currentMileage: number; status: VehicleStatus; classification?: VehicleClassification; collectionId?: string; isPrimary?: boolean; unitNumber?: string; department?: string; locationLabel?: string; assignedDriverName?: string; usageType?: string; purchaseDate?: string; purchasePrice?: number; color?: string; soldDate?: string; salePrice?: number; notes?: string; createdAt: string; updatedAt: string; }
export interface GarageCollection { id: string; name: string; description?: string; kind: GarageCollectionKind; sortOrder: number; archived?: boolean; createdAt: string; updatedAt: string; }
export interface VehicleMaintenanceItem { id: string; vehicleId: string; name: string; intervalMiles?: number; intervalMonths?: number; lastServiceMileage?: number; lastServiceDate?: string; nextDueMileage?: number; nextDueDate?: string; priority: MaintenancePriority; notes?: string; createdAt: string; }
export interface VehicleServiceRecord { id: string; vehicleId: string; date: string; mileage?: number; title: string; description?: string; cost?: number; shop?: string; maintenanceItemId?: string; createdAt: string; }
export interface VehicleIssue { id: string; vehicleId: string; title: string; description?: string; severity: IssueSeverity; status: IssueStatus; reportedAt: string; resolvedAt?: string; mileage?: number; notes?: string; createdAt: string; }
export interface VehicleModification { id: string; vehicleId: string; name: string; category: ModificationCategory; installedAt?: string; mileage?: number; cost?: number; laborCost?: number; brand?: string; partNumber?: string; purchaseDate?: string; installer?: string; description?: string; status?: string; createdAt: string; }
export interface VehicleExpense { id: string; vehicleId: string; date: string; category: ExpenseCategory; amount: number; description?: string; mileage?: number; createdAt: string; }
export interface VehicleReminder { id: string; vehicleId: string; title: string; dueDate?: string; dueMileage?: number; completed: boolean; createdAt: string; }
export interface VehicleMileageEntry { id: string; vehicleId: string; date: string; mileage: number; note?: string; source?: "user" | "service" | "fuel" | "connected"; }
export interface VehicleFuelRecord { id: string; vehicleId: string; date: string; odometer: number; gallons: number; totalCostMinor?: number; pricePerGallonMinor?: number; fullTank: boolean; station?: string; fuelGrade?: FuelGrade; notes?: string; createdAt: string; }
export interface VehicleVinSpecifications { source: "nhtsa-vpic"; decodedAt: string; modelYear?: string; make?: string; model?: string; trim?: string; vehicleType?: VehicleType; bodyClass?: string; manufacturer?: string; engineCylinders?: string; displacement?: string; fuelType?: string; driveType?: string; transmission?: string; }
export interface VehicleDocumentReference { id: string; vehicleId: string; title: string; category: "service-receipt" | "parts-receipt" | "registration" | "insurance" | "inspection" | "purchase-paperwork" | "warranty" | "other"; storageFileId: string; recordType?: "vehicle" | "maintenance" | "service" | "modification" | "issue" | "expense"; recordId?: string; createdAt: string; }
export interface GarageTimelineEntry { id: string; date: string; type: GarageTimelineType; title: string; metadata?: string; recordId?: string; }
export interface VehicleConnection { id: string; vehicleId: string; providerKind: VehicleConnectionProviderKind; status: VehicleConnectionStatus; deviceLabel?: string; capabilities: string[]; lastConnectedAt?: string; lastSyncedAt?: string; metadata?: Record<string, string>; }
export interface DiagnosticCode { code: string; description?: string; status?: string; system?: string; firstSeen?: string; lastSeen?: string; }
export interface DiagnosticScan { id: string; vehicleId: string; timestamp: string; mileage?: number; milOn?: boolean; codes: DiagnosticCode[]; provider: VehicleConnectionProviderKind | "manual"; connectionId?: string; notes?: string; }
export interface VehicleTelemetrySnapshot { vehicleId?: string; timestamp: string; source: VehicleConnectionProviderKind; rpm?: number; speed?: number; coolantTemperature?: number; engineLoad?: number; fuelLevel?: number; batteryVoltage?: number; intakeTemperature?: number; }
export type GarageEstimateStatus = "estimate" | "quoted" | "accepted" | "declined" | "completed";
export interface GarageRepairEstimate { id: string; vehicleId: string; issueId?: string; serviceId?: string; category: string; description?: string; partsMinMinor?: number; partsMaxMinor?: number; laborMinMinor?: number; laborMaxMinor?: number; source: string; sourceType: "shop-published" | "provider-estimate" | "regional-estimate" | "user-quote"; providerReference?: string; currency?: string; region?: string; shop?: string; notes?: string; status?: GarageEstimateStatus; totalMinMinor?: number; totalMaxMinor?: number; timestamp: string; expiresAt?: string; availability: "available" | "unavailable"; }

export interface GarageLocalData { version: 1; selectedVehicleId?: string; selectedCollectionId?: string; vehicles: Vehicle[]; collections: GarageCollection[]; maintenance: VehicleMaintenanceItem[]; services: VehicleServiceRecord[]; issues: VehicleIssue[]; modifications: VehicleModification[]; expenses: VehicleExpense[]; reminders: VehicleReminder[]; mileageHistory: VehicleMileageEntry[]; fuelRecords: VehicleFuelRecord[]; documents: VehicleDocumentReference[]; connections: VehicleConnection[]; diagnosticScans: DiagnosticScan[]; telemetrySnapshots: VehicleTelemetrySnapshot[]; repairEstimates: GarageRepairEstimate[]; }
export interface VehicleSnapshot { id: string; name: string; make: string; model: string; year: number; mileage?: number; maintenanceDue?: string; connected: boolean; }
