import type { SportKind, SportsEvent, SportsProviderCapabilities, SportsStanding } from "@/core/contracts/Sports";

export interface SportsProviderResult {
  events: SportsEvent[];
  standings?: SportsStanding[];
}

export interface SportsProvider {
  readonly id: string;
  readonly sport: SportKind;
  readonly cacheSeconds: number;
  readonly providerName: string;
  readonly official: boolean;
  readonly fallback: boolean;
  readonly capabilities: SportsProviderCapabilities;
  readonly sourceUrl?: string;
  getSnapshot(now: Date): Promise<SportsProviderResult>;
}

export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function string(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function number(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function date(value: unknown): Date | undefined {
  const input = string(value);
  if (!input) return undefined;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function fetchJson(url: string, revalidate: number): Promise<unknown> {
  const response = await fetch(url, { next: { revalidate } });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}
