"use client";

import { useMemo } from "react";
import type { MaintenanceStatus, VehicleMaintenanceItem, VehicleReminder } from "@/core/contracts/Garage";
import { useGarageRepository } from "@/services/garage/localRepository";

const DAY = 86_400_000;

export function localDateValue(date = new Date()): string { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, "0"); const day = String(date.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
export function localDateFromValue(value: string): Date | undefined { const [year, month, day] = value.split("-").map(Number); return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day) ? new Date(year, month - 1, day, 12) : undefined; }
export function addCalendarMonths(value: string, months: number): string | undefined { const date = localDateFromValue(value); if (!date || !Number.isInteger(months)) return undefined; const originalDay = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + months); const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); date.setDate(Math.min(originalDay, lastDay)); return localDateValue(date); }

export function maintenanceStatus(item: VehicleMaintenanceItem, mileage: number, now = new Date()): MaintenanceStatus {
  const dueMileage = item.nextDueMileage;
  const dueDate = item.nextDueDate ? localDateFromValue(item.nextDueDate) : undefined;
  if (dueMileage === undefined && !dueDate) return "notScheduled";
  if ((dueMileage !== undefined && mileage >= dueMileage) || (dueDate && now >= dueDate)) return "overdue";
  if ((dueMileage !== undefined && dueMileage - mileage <= 500) || (dueDate && dueDate.getTime() - now.getTime() <= 30 * DAY)) return "dueSoon";
  return "upcoming";
}

export function reminderStatus(item: VehicleReminder, mileage: number, now = new Date()): MaintenanceStatus | "completed" {
  if (item.completed) return "completed";
  const dueDate = item.dueDate ? localDateFromValue(item.dueDate) : undefined;
  if (item.dueMileage === undefined && !dueDate) return "notScheduled";
  if ((item.dueMileage !== undefined && mileage >= item.dueMileage) || (dueDate && now >= dueDate)) return "overdue";
  if ((item.dueMileage !== undefined && item.dueMileage - mileage <= 500) || (dueDate && dueDate.getTime() - now.getTime() <= 30 * DAY)) return "dueSoon";
  return "upcoming";
}

export function useGarage() {
  const repository = useGarageRepository();
  const selected = repository.selectedVehicle;
  const summary = useMemo(() => {
    if (!selected) return null;
    const maintenance = repository.data.maintenance.filter((item) => item.vehicleId === selected.id);
    const statusById = new Map(maintenance.map((item) => [item.id, maintenanceStatus(item, selected.currentMileage)]));
    const issues = repository.data.issues.filter((item) => item.vehicleId === selected.id);
    return { maintenance, statusById, issues, services: repository.data.services.filter((item) => item.vehicleId === selected.id).sort((a, b) => b.date.localeCompare(a.date)), modifications: repository.data.modifications.filter((item) => item.vehicleId === selected.id).sort((a, b) => (b.installedAt ?? b.createdAt).localeCompare(a.installedAt ?? a.createdAt)), expenses: repository.data.expenses.filter((item) => item.vehicleId === selected.id), reminders: repository.data.reminders.filter((item) => item.vehicleId === selected.id), mileageHistory: repository.data.mileageHistory.filter((item) => item.vehicleId === selected.id).sort((a, b) => b.date.localeCompare(a.date)) };
  }, [repository.data, selected]);
  return { ...repository, selectedVehicle: selected, summary, loading: !repository.ready, error: undefined as string | undefined };
}
