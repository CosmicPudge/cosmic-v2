import "server-only";

import { createHash } from "node:crypto";

interface WritableEventTarget {
  ownerKey: string;
  calendarId: string;
  resourceUrl: string;
  etag: string;
  uid?: string;
  isRecurring: boolean;
  allDay: boolean;
  expiresAt: number;
}

const TARGET_TTL_MS = 15 * 60 * 1000;
const targets = new Map<string, WritableEventTarget>();

export function registerWritableEventTarget(target: Omit<WritableEventTarget, "expiresAt">): string {
  const id = createHash("sha256")
    .update(`${target.ownerKey}:${target.calendarId}:${target.resourceUrl}`)
    .digest("hex");

  targets.set(id, { ...target, expiresAt: Date.now() + TARGET_TTL_MS });

  return id;
}

export function getWritableEventTarget(id: string, ownerKey?: string): WritableEventTarget | null {
  const target = targets.get(id);

  if (!target || target.expiresAt < Date.now()) {
    targets.delete(id);
    return null;
  }

  if (ownerKey && target.ownerKey !== ownerKey) return null;

  return target;
}

export function clearWritableEventTargets(ownerKey: string): void {
  for (const [id, target] of targets) if (target.ownerKey === ownerKey) targets.delete(id);
}

export function removeWritableEventTarget(id: string): void {
  targets.delete(id);
}
