"use client";

export async function registerCosmicServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("/sw.js", { scope: "/" }); } catch { return null; }
}

export async function getCurrentPushSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager?.getSubscription() ?? null;
}

export function serializePushSubscription(subscription: PushSubscription | null | undefined) {
  return subscription?.toJSON() ?? null;
}

type PushStatusResponse = { configured?: boolean; registered?: boolean; publicKey?: string };
type PushReconciliationState = "enabled" | "not-enabled" | "config-required";

export async function reconcileWhenAuthenticated({ accountLoading, authenticated, discover, reconcile }: { accountLoading: boolean; authenticated: boolean; discover(): Promise<PushSubscription | null>; reconcile(subscription: PushSubscription | null): Promise<PushReconciliationState> }) {
  if (accountLoading || !authenticated) return "waiting" as const;
  return reconcile(await discover());
}

export async function reconcilePushSubscription(subscription: PushSubscription | null, fetcher: typeof fetch = fetch): Promise<PushReconciliationState> {
  const payload = JSON.stringify({ subscription: serializePushSubscription(subscription) });
  const status = await fetcher("/api/push/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
  if (!status.ok) throw new Error("Push status is unavailable.");
  const current = await status.json() as PushStatusResponse;
  if (!current.configured) return "config-required" as const;
  if (!subscription || current.registered) return current.registered ? "enabled" as const : "not-enabled" as const;

  const saved = await fetcher("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
  if (!saved.ok) throw new Error("Push subscription could not be saved.");
  const confirmation = await fetcher("/api/push/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
  if (!confirmation.ok) throw new Error("Push registration could not be confirmed.");
  const confirmed = await confirmation.json() as PushStatusResponse;
  if (!confirmed.registered) throw new Error("Push registration could not be confirmed.");
  return "enabled" as const;
}

export async function reconcileCurrentPushSubscription(subscription?: PushSubscription | null) {
  const current = subscription === undefined ? await getCurrentPushSubscription() : subscription;
  if (!current) return false;
  return (await reconcilePushSubscription(current)) === "enabled";
}
