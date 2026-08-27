import "server-only";

import { eq, sql } from "drizzle-orm";

import type { KioskSlideshowCommand, KioskSlideshowPauseReason } from "@/core/contracts/Kiosk";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { kioskDeviceSettings } from "@/services/database/schema";

export interface KioskSlideshowState {
  paused: boolean;
  pauseReason: KioskSlideshowPauseReason;
  currentSlide: string | null;
  holdMusicWhilePlaying: boolean;
  lastSeenAt: string | null;
  lastBootId: string | null;
  command: KioskSlideshowCommand | null;
  commandRevision: number;
  appliedCommandRevision: number;
}

function database() {
  if (!isDatabaseConfigured()) throw new Error("Kiosk slideshow control requires durable storage.");
  return getDatabase();
}

function stateFromRow(row: typeof kioskDeviceSettings.$inferSelect | undefined): KioskSlideshowState {
  return {
    paused: row?.slideshowPaused ?? false,
    pauseReason: (row?.slideshowPauseReason as KioskSlideshowPauseReason | null | undefined) ?? null,
    currentSlide: row?.slideshowCurrentSlide ?? null,
    holdMusicWhilePlaying: row?.slideshowHoldMusicWhilePlaying ?? false,
    lastSeenAt: row?.slideshowLastSeenAt?.toISOString() ?? null,
    lastBootId: row?.slideshowLastBootId ?? null,
    command: (row?.slideshowCommand as KioskSlideshowCommand | null | undefined) ?? null,
    commandRevision: row?.slideshowCommandRevision ?? 0,
    appliedCommandRevision: row?.slideshowAppliedCommandRevision ?? 0,
  };
}

async function ensureRow(deviceId: string) {
  const db = database();
  const [row] = await db.select().from(kioskDeviceSettings).where(eq(kioskDeviceSettings.deviceId, deviceId)).limit(1);
  if (row) return row;
  const [created] = await db.insert(kioskDeviceSettings).values({ deviceId }).returning();
  return created;
}

export async function readKioskSlideshowState(deviceId: string, bootId?: string) {
  const db = database();
  let row = await ensureRow(deviceId);
  if (bootId && row.slideshowLastBootId && row.slideshowLastBootId !== bootId) {
    const [reset] = await db.update(kioskDeviceSettings).set({
      slideshowPaused: false,
      slideshowPauseReason: null,
      slideshowCommand: null,
      slideshowAppliedCommandRevision: row.slideshowCommandRevision,
      slideshowLastBootId: bootId,
      slideshowLastSeenAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(kioskDeviceSettings.deviceId, deviceId)).returning();
    row = reset ?? row;
  }
  return stateFromRow(row);
}

export async function applyKioskSlideshowCommand(deviceId: string, command: Exclude<KioskSlideshowCommand, "resume"> | "resume", holdMusicWhilePlaying?: boolean) {
  const db = database();
  const row = await ensureRow(deviceId);
  const now = new Date();
  const updates = {
    slideshowCommand: command,
    slideshowCommandRevision: sql`${kioskDeviceSettings.slideshowCommandRevision} + 1`,
    ...(command === "pause" ? { slideshowPaused: true, slideshowPauseReason: "manual" } : {}),
    ...(command === "resume" ? { slideshowPaused: false, slideshowPauseReason: null } : {}),
    ...(typeof holdMusicWhilePlaying === "boolean" ? { slideshowHoldMusicWhilePlaying: holdMusicWhilePlaying } : {}),
    updatedAt: now,
  };
  const [updated] = await db.update(kioskDeviceSettings).set(updates).where(eq(kioskDeviceSettings.deviceId, deviceId)).returning();
  return stateFromRow(updated ?? row);
}

export async function setKioskHoldMusic(deviceId: string, holdMusicWhilePlaying: boolean) {
  const db = database();
  const [updated] = await db.update(kioskDeviceSettings).set({ slideshowHoldMusicWhilePlaying: holdMusicWhilePlaying, updatedAt: new Date() }).where(eq(kioskDeviceSettings.deviceId, deviceId)).returning();
  return stateFromRow(updated ?? await ensureRow(deviceId));
}

export async function reportKioskSlideshowState(deviceId: string, input: { bootId: string; currentSlide: string; paused: boolean; pauseReason: KioskSlideshowPauseReason; appliedCommandRevision: number }) {
  const db = database();
  const row = await ensureRow(deviceId);
  const now = new Date();
  const appliedRevision = Math.max(0, Math.min(input.appliedCommandRevision, row.slideshowCommandRevision));
  const canReportPause = appliedRevision >= row.slideshowCommandRevision;
  const [updated] = await db.update(kioskDeviceSettings).set({
    slideshowCurrentSlide: input.currentSlide,
    ...(canReportPause ? { slideshowPaused: input.paused, slideshowPauseReason: input.pauseReason } : {}),
    slideshowAppliedCommandRevision: appliedRevision,
    slideshowLastBootId: input.bootId,
    slideshowLastSeenAt: now,
    updatedAt: now,
  }).where(eq(kioskDeviceSettings.deviceId, deviceId)).returning();
  return stateFromRow(updated ?? row);
}
