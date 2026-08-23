"use client";

import { useMemo } from "react";
import type { GarageTimelineEntry, MaintenanceStatus, VehicleMaintenanceItem, VehicleReminder } from "@/core/contracts/Garage";
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
    const mileageHistory = repository.data.mileageHistory.filter((item) => item.vehicleId === selected.id).sort((a, b) => b.date.localeCompare(a.date));
    const currentMileage = mileageHistory[0]?.mileage ?? selected.currentMileage;
    const months = new Set(mileageHistory.map((item) => item.date.slice(0, 7)));
    const oldest = mileageHistory[mileageHistory.length - 1];
    const newest = mileageHistory[0];
    const monthSpan = oldest && newest ? (Number(newest.date.slice(0, 4)) - Number(oldest.date.slice(0, 4))) * 12 + Number(newest.date.slice(5, 7)) - Number(oldest.date.slice(5, 7)) : 0;
    const averageMonthlyMileage = months.size >= 3 && monthSpan > 0 ? Math.max(0, (newest.mileage - oldest.mileage) / monthSpan) : undefined;
    const maintenance = repository.data.maintenance.filter((item) => item.vehicleId === selected.id);
    const statusById = new Map(maintenance.map((item) => [item.id, maintenanceStatus(item, currentMileage)]));
    const issues = repository.data.issues.filter((item) => item.vehicleId === selected.id);
    const services = repository.data.services.filter((item) => item.vehicleId === selected.id).sort((a, b) => b.date.localeCompare(a.date));
    const modifications = repository.data.modifications.filter((item) => item.vehicleId === selected.id).sort((a, b) => (b.installedAt ?? b.createdAt).localeCompare(a.installedAt ?? a.createdAt));
    const expenses = repository.data.expenses.filter((item) => item.vehicleId === selected.id);
    const reminders = repository.data.reminders.filter((item) => item.vehicleId === selected.id);
    const fuelRecords = repository.data.fuelRecords.filter((item) => item.vehicleId === selected.id).sort((a, b) => b.date.localeCompare(a.date));
    const mpgIntervals = fuelRecords.map((record, index) => { const previous = fuelRecords[index + 1]; if (!record.fullTank || !previous?.fullTank || record.odometer <= previous.odometer || record.gallons <= 0) return undefined; return { recordId: record.id, date: record.date, mpg: (record.odometer - previous.odometer) / record.gallons }; }).filter((item): item is { recordId: string; date: string; mpg: number } => Boolean(item));
    const fuelCostMinor = fuelRecords.reduce((sum, item) => sum + (item.totalCostMinor ?? 0), 0);
    const latestMpg = mpgIntervals[0]?.mpg;
    const averageMpg = mpgIntervals.length ? mpgIntervals.reduce((sum, item) => sum + item.mpg, 0) / mpgIntervals.length : undefined;
    const bestMpg = mpgIntervals.length ? Math.max(...mpgIntervals.map((item) => item.mpg)) : undefined;
    const timeline: GarageTimelineEntry[] = [
      ...mileageHistory.map((item) => ({ id: `mileage:${item.id}`, date: item.date, type: "mileage" as const, title: `${item.mileage.toLocaleString()} mile reading`, metadata: item.note, recordId: item.id })),
      ...fuelRecords.map((item) => ({ id: `fuel:${item.id}`, date: item.date, type: "fuel" as const, title: "Fuel fill-up", metadata: `${item.gallons} gal${item.totalCostMinor !== undefined ? ` · $${(item.totalCostMinor / 100).toFixed(2)}` : ""}`, recordId: item.id })),
      ...services.map((item) => ({ id: `service:${item.id}`, date: item.date, type: "service" as const, title: item.title, metadata: item.cost === undefined ? undefined : `$${item.cost.toFixed(2)}`, recordId: item.id })),
      ...issues.map((item) => ({ id: `issue:${item.id}`, date: item.reportedAt, type: "issue" as const, title: item.title, metadata: `${item.severity} · ${item.status}`, recordId: item.id })),
      ...modifications.map((item) => ({ id: `modification:${item.id}`, date: item.installedAt ?? item.createdAt.slice(0, 10), type: "modification" as const, title: item.name, metadata: item.category, recordId: item.id })),
      ...reminders.filter((item) => item.completed).map((item) => ({ id: `reminder:${item.id}`, date: item.createdAt.slice(0, 10), type: "reminder" as const, title: item.title, metadata: "Completed", recordId: item.id })),
      ...(selected.purchaseDate ? [{ id: `purchase:${selected.id}`, date: selected.purchaseDate, type: "purchase" as const, title: "Vehicle purchased", metadata: selected.purchasePrice === undefined ? undefined : `$${selected.purchasePrice.toFixed(2)}` }] : []),
      ...(selected.soldDate ? [{ id: `sale:${selected.id}`, date: selected.soldDate, type: "sale" as const, title: "Vehicle sold", metadata: selected.salePrice === undefined ? undefined : `$${selected.salePrice.toFixed(2)}` }] : []),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return { maintenance, statusById, issues, currentMileage, averageMonthlyMileage, services, modifications, expenses, reminders, mileageHistory, fuelRecords, mpgIntervals, latestMpg, averageMpg, bestMpg, fuelCostMinor, timeline };
  }, [repository.data, selected]);
  return { ...repository, selectedVehicle: selected, summary, loading: !repository.ready, error: undefined as string | undefined };
}
