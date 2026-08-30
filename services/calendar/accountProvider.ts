import "server-only";

import { CalendarEngine, type CalendarProvider } from "@/engines/calendar";
import { CombinedCalendarProvider } from "./combinedCalendarProvider";
import { AppleCalendarProvider } from "./appleCalendarProvider";
import { AppleCalendarWriter } from "./appleCalendarWriter";
import { SubscriptionCalendarProvider } from "./subscriptionCalendarProvider";
import { TestCalendarProvider } from "./testCalendarProvider";
import { getCalendarSubscriptions } from "./subscriptionConfig";
import { getProviderCredentials, listProviderConnections } from "@/services/providers/store";
import type { CalendarSubscription } from "./subscriptions";

export interface CalendarCredentialPayload { username: string; password: string; serverUrl: string; defaultCalendarName?: string; }

async function getAccountSubscriptions(userId: string): Promise<CalendarSubscription[]> {
  const connections = (await listProviderConnections(userId)).filter(
    (item) => item.provider === "calendar" && item.providerType === "subscription" && item.status === "connected",
  );
  const subscriptions = await Promise.all(connections.map(async (connection) => {
    const credentials = await getProviderCredentials<{ url?: string; category?: CalendarSubscription["category"]; priority?: CalendarSubscription["priority"] }>(userId, connection.id);
    if (!credentials?.url || !connection.displayName) return null;
    return { id: connection.id, name: connection.displayName, url: credentials.url, enabled: true, category: credentials.category, priority: credentials.priority ?? "normal" } satisfies CalendarSubscription;
  }));
  return subscriptions.flatMap((subscription) => subscription ? [subscription] : []);
}

async function withSubscriptions(privateProvider: CalendarProvider, userId: string): Promise<CalendarProvider> {
  const subscriptions = [...getCalendarSubscriptions(), ...(await getAccountSubscriptions(userId))];
  return subscriptions.length ? new CombinedCalendarProvider([privateProvider, new SubscriptionCalendarProvider(subscriptions)]) : privateProvider;
}

export async function getAccountCalendarContext(userId: string, connectionId?: string) {
  const connections = (await listProviderConnections(userId)).filter((item) => item.provider === "calendar" && item.providerType !== "subscription");
  const selectedConnections = connectionId ? connections.filter((item) => item.id === connectionId) : connections;
  const contexts = (await Promise.all(selectedConnections.map(async (connection) => {
    const credentials = await getProviderCredentials<CalendarCredentialPayload>(userId, connection.id);
    if (!credentials) return null;
    return { connection, provider: new AppleCalendarProvider({ ...credentials, ownerKey: `${userId}:${connection.id}` }), writer: new AppleCalendarWriter({ ...credentials, ownerKey: `${userId}:${connection.id}` }) };
  }))).flatMap((context) => context ? [context] : []);
  if (!contexts.length) return null;
  const privateProvider = contexts.length === 1 ? contexts[0].provider : new CombinedCalendarProvider(contexts.map((context) => context.provider));
  return { connection: contexts[0].connection, provider: await withSubscriptions(privateProvider, userId), writer: contexts[0].writer };
}

export async function getCalendarEngineForRequest(userId?: string, connectionId?: string) {
  const context = userId ? await getAccountCalendarContext(userId, connectionId) : null;
  let provider: CalendarProvider | null | undefined = context?.provider;
  if (!provider && userId) {
    const subscriptions = [...getCalendarSubscriptions(), ...(await getAccountSubscriptions(userId))];
    if (subscriptions.length) provider = new SubscriptionCalendarProvider(subscriptions);
  }
  if (!provider) provider = process.env.NODE_ENV === "production" ? null : await getDevelopmentProvider();
  if (!provider) return null;
  const engine = new CalendarEngine();
  engine.setProvider(provider);
  await engine.initialize();
  return { engine, context };
}

async function getDevelopmentProvider(): Promise<CalendarProvider> {
  const appleConfigured = Boolean(process.env.APPLE_CALENDAR_USERNAME && process.env.APPLE_CALENDAR_PASSWORD);
  const apple = appleConfigured ? new AppleCalendarProvider({ ownerKey: "development-environment" }) : new TestCalendarProvider();
  const subscriptions = getCalendarSubscriptions();
  return subscriptions.length ? new CombinedCalendarProvider([apple, new SubscriptionCalendarProvider(subscriptions)]) : apple;
}
