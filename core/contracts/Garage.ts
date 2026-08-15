export type VehicleStatus = "active" | "maintenance" | "stored" | "sold" | "retired";
export type MaintenancePriority = "low" | "medium" | "high";
export type MaintenanceStatus = "overdue" | "dueSoon" | "upcoming" | "notScheduled";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "monitoring" | "resolved";
export type ModificationCategory = "Performance" | "Suspension" | "Wheels/Tires" | "Exterior" | "Interior" | "Audio" | "Electrical" | "Other";
export type ExpenseCategory = "Fuel" | "Maintenance" | "Repair" | "Modification" | "Registration" | "Insurance" | "Other";

export interface Vehicle { id: string; nickname: string; year: number; make: string; model: string; trim?: string; vin?: string; licensePlate?: string; currentMileage: number; status: VehicleStatus; notes?: string; createdAt: string; updatedAt: string; }
export interface VehicleMaintenanceItem { id: string; vehicleId: string; name: string; intervalMiles?: number; intervalMonths?: number; lastServiceMileage?: number; lastServiceDate?: string; nextDueMileage?: number; nextDueDate?: string; priority: MaintenancePriority; notes?: string; createdAt: string; }
export interface VehicleServiceRecord { id: string; vehicleId: string; date: string; mileage?: number; title: string; description?: string; cost?: number; shop?: string; maintenanceItemId?: string; createdAt: string; }
export interface VehicleIssue { id: string; vehicleId: string; title: string; description?: string; severity: IssueSeverity; status: IssueStatus; reportedAt: string; resolvedAt?: string; mileage?: number; notes?: string; createdAt: string; }
export interface VehicleModification { id: string; vehicleId: string; name: string; category: ModificationCategory; installedAt?: string; mileage?: number; cost?: number; description?: string; status?: string; createdAt: string; }
export interface VehicleExpense { id: string; vehicleId: string; date: string; category: ExpenseCategory; amount: number; description?: string; mileage?: number; createdAt: string; }
export interface VehicleReminder { id: string; vehicleId: string; title: string; dueDate?: string; dueMileage?: number; completed: boolean; createdAt: string; }
export interface VehicleMileageEntry { id: string; vehicleId: string; date: string; mileage: number; }

export interface GarageLocalData { version: 1; selectedVehicleId?: string; vehicles: Vehicle[]; maintenance: VehicleMaintenanceItem[]; services: VehicleServiceRecord[]; issues: VehicleIssue[]; modifications: VehicleModification[]; expenses: VehicleExpense[]; reminders: VehicleReminder[]; mileageHistory: VehicleMileageEntry[]; }
export interface VehicleSnapshot { id: string; name: string; make: string; model: string; year: number; mileage?: number; maintenanceDue?: string; connected: boolean; }
