import "server-only";

import { CalendarEngine, type CalendarProvider } from "@/engines/calendar";
import { CombinedCalendarProvider } from "./combinedCalendarProvider";
import { AppleCalendarProvider } from "./appleCalendarProvider";
import { AppleCalendarWriter } from "./appleCalendarWriter";
import { SubscriptionCalendarProvider } from "./subscriptionCalendarProvider";
import { TestCalendarProvider } from "./testCalendarProvider";
import { getCalendarSubscriptions } from "./subscriptionConfig";
import { getProviderCredentials, listProviderConnections } from "@/services/providers/store";

export interface CalendarCredentialPayload { username: string; password: string; serverUrl: string; defaultCalendarName?: string; }

function withSubscriptions(privateProvider: CalendarProvider): CalendarProvider {
  const subscriptions = getCalendarSubscriptions();
  return subscriptions.length ? new CombinedCalendarProvider([privateProvider, new SubscriptionCalendarProvider(subscriptions)]) : privateProvider;
}

export async function getAccountCalendarContext(userId: string, connectionId?: string) {
  const connections = (await listProviderConnections(userId)).filter((item) => item.provider === "calendar");
  const connection = connectionId ? connections.find((item) => item.id === connectionId) : connections[0];
  if (!connection) return null;
  const credentials = await getProviderCredentials<CalendarCredentialPayload>(userId, connection.id);
  if (!credentials) return null;
  const provider = new AppleCalendarProvider({ ...credentials, ownerKey: `${userId}:${connection.id}` });
  return { connection, provider: withSubscriptions(provider), writer: new AppleCalendarWriter({ ...credentials, ownerKey: `${userId}:${connection.id}` }) };
}

export async function getCalendarEngineForRequest(userId?: string, connectionId?: string) {
  const context = userId ? await getAccountCalendarContext(userId, connectionId) : null;
  const provider = context?.provider ?? (process.env.NODE_ENV === "production" ? null : getDevelopmentProvider());
  if (!provider) return null;
  const engine = new CalendarEngine();
  engine.setProvider(provider);
  await engine.initialize();
  return { engine, context };
}

function getDevelopmentProvider(): CalendarProvider {
  const appleConfigured = Boolean(process.env.APPLE_CALENDAR_USERNAME && process.env.APPLE_CALENDAR_PASSWORD);
  const apple = appleConfigured ? new AppleCalendarProvider({ ownerKey: "development-environment" }) : new TestCalendarProvider();
  return withSubscriptions(apple);
}
