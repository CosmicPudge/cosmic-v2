import { createLocalProviderCredentialStore } from "@/services/providers/localCredentialStore";
import { PERSONAL_OWNER } from "@/services/ownership/owner";
import type { CalDavConfig } from "./caldav";

export const PERSONAL_CALENDAR_PROVIDER = "calendar" as const;

export interface PersonalCalendarConnection extends CalDavConfig {
  defaultCalendarName?: string;
}

function store() { return createLocalProviderCredentialStore(); }

function valid(value: unknown): value is PersonalCalendarConnection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.username === "string" && item.username.length > 0 && item.username.length <= 320
    && typeof item.password === "string" && item.password.length > 0 && item.password.length <= 500
    && typeof item.serverUrl === "string" && /^https:\/\//i.test(item.serverUrl)
    && (item.defaultCalendarName === undefined || typeof item.defaultCalendarName === "string");
}

export async function getPersonalCalendarConnection(): Promise<PersonalCalendarConnection | null> {
  const value = await store().get(PERSONAL_OWNER, PERSONAL_CALENDAR_PROVIDER);
  return valid(value) ? value : null;
}

export async function savePersonalCalendarConnection(connection: PersonalCalendarConnection): Promise<void> {
  if (!valid(connection)) throw new Error("Invalid personal Calendar connection.");
  await store().set(PERSONAL_OWNER, PERSONAL_CALENDAR_PROVIDER, connection as unknown as Record<string, unknown>);
}

export async function deletePersonalCalendarConnection(): Promise<boolean> {
  return store().delete(PERSONAL_OWNER, PERSONAL_CALENDAR_PROVIDER);
}
