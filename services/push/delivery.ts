import "server-only";

import webpush from "web-push";

import { getWebPushConfig } from "./config";
import { claimPushDelivery, completePushDelivery, getActivePushSubscriptions, markPushSubscriptionFailure, markPushSubscriptionSuccess } from "./store";
import { safePushRoute } from "./routes";

export interface PushPayload {
  signalId: string;
  title: string;
  body: string;
  route: string;
  category: string;
  tag: string;
}

export function isPushConfigured() { return Boolean(getWebPushConfig()); }

export async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  const config = getWebPushConfig();
  if (!config) throw new Error("Web Push is not configured.");
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ signalId: payload.signalId, title: payload.title, body: payload.body, route: payload.route, category: payload.category, tag: payload.tag }));
}

export async function deliverSportsSignalToUser(userId: string, signal: PushPayload & { eventId?: string; sport?: string }) {
  const results: Array<"delivered" | "skipped" | "temporary_failure" | "expired"> = [];
  for (const subscription of await getActivePushSubscriptions(userId)) {
    const delivery = await claimPushDelivery(signal.signalId, subscription.id, signal.category, signal.eventId, signal.sport, signal.title, signal.body, signal.route);
    if (!delivery) { results.push("skipped"); continue; }
    try {
      await sendWebPush(subscription, { ...signal, route: safePushRoute(signal.route), tag: signal.tag || signal.signalId });
      await completePushDelivery(delivery.id, "delivered");
      await markPushSubscriptionSuccess(subscription.id);
      results.push("delivered");
    } catch (error) {
      const providerCode = typeof error === "object" && error !== null && "statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number" ? (error as { statusCode: number }).statusCode : undefined;
      const expired = providerCode === 404 || providerCode === 410;
      await completePushDelivery(delivery.id, expired ? "permanent_failure" : "temporary_failure", providerCode);
      if (expired) { await markPushSubscriptionFailure(subscription.id, "expired", `provider_${providerCode}`); results.push("expired"); }
      else results.push("temporary_failure");
    }
  }
  return results;
}
