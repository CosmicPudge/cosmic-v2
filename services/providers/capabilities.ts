import "server-only";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { providerConnections } from "@/services/database/schema";
import type { ProviderCapability } from "./store";

function capabilities(value: unknown): ProviderCapability[] { if (!Array.isArray(value)) return []; return value.filter((item): item is ProviderCapability => item === "mail.read" || item === "mail.send" || item === "calendar.read" || item === "calendar.write" || item === "music.read" || item === "music.playback"); }
export function declaredProviderCapabilities(metadata: unknown): ProviderCapability[] { if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return []; return capabilities((metadata as Record<string, unknown>).capabilities); }
export async function getConnectionsForCapability(accountId: string, capability: ProviderCapability) { const rows = await getDatabase().select().from(providerConnections).where(and(eq(providerConnections.userId, accountId), eq(providerConnections.status, "connected"), eq(providerConnections.reconnectRequired, false))); return rows.filter((row) => declaredProviderCapabilities(row.metadata).includes(capability)); }
