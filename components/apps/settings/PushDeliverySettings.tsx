"use client";

import { useEffect, useState } from "react";
import { useCosmicAccount } from "@/components/account/AccountProvider";
import { getCurrentPushSubscription, reconcilePushSubscription, reconcileWhenAuthenticated, serializePushSubscription } from "@/services/push/registration";

type State = "loading" | "unsupported" | "config-required" | "not-enabled" | "enabled" | "blocked" | "reconnect";

function decodePublicKey(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export default function PushDeliverySettings() {
  const { loading: accountLoading, authenticated } = useCosmicAccount();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    setState("loading");
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) { setState("unsupported"); return; }
    if (Notification.permission === "denied") { setState("blocked"); return; }
    try {
      const nextState = await reconcileWhenAuthenticated({ accountLoading: false, authenticated: true, discover: getCurrentPushSubscription, reconcile: reconcilePushSubscription });
      if (nextState !== "waiting") setState(nextState);
    } catch { setState("reconnect"); }
  };

  useEffect(() => {
    if (accountLoading || !authenticated) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [accountLoading, authenticated]);

  const enable = async () => {
    setBusy(true); setNotice("");
    try {
      const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      if (permission === "denied") { setState("blocked"); return; }
      if (permission !== "granted") { setState("not-enabled"); return; }
      const currentSubscription = await getCurrentPushSubscription();
      const response = await fetch("/api/push/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await response.json() as { configured?: boolean; publicKey?: string };
      if (!data.configured || !data.publicKey) { setState("config-required"); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = currentSubscription ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodePublicKey(data.publicKey) as BufferSource });
      const save = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: serializePushSubscription(subscription) }) });
      if (!save.ok) throw new Error("Subscription could not be saved.");
      setState(await reconcilePushSubscription(subscription)); setNotice("Browser notifications are enabled on this device.");
    } catch { setState("reconnect"); setNotice("Notifications could not be enabled in this browser."); } finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true); setNotice("");
    try {
      const subscription = await getCurrentPushSubscription();
      if (subscription) { await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: serializePushSubscription(subscription) }) }); await subscription.unsubscribe(); }
      setState("not-enabled"); setNotice("Browser notifications are disabled on this device.");
    } catch { setNotice("Notifications could not be disabled. Please try again."); } finally { setBusy(false); }
  };

  const label = { loading: "Checking…", unsupported: "Unsupported", "config-required": "Config required", "not-enabled": "Not enabled", enabled: "Enabled", blocked: "Blocked", reconnect: "Reconnect notifications" }[state];
  const sendTest = async () => { setBusy(true); setNotice(""); try { const subscription = await getCurrentPushSubscription(); const response = await fetch("/api/push/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: serializePushSubscription(subscription) }) }); if (!response.ok) throw new Error("Test notification failed."); setNotice("Test notification sent."); } catch { setNotice("Test notification could not be sent."); } finally { setBusy(false); } };
  return <section className="mt-5 rounded-xl border border-white/10 bg-black/10 p-3.5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold">Browser / PWA notifications</h4><p className="mt-1 text-xs text-white/35">Get eligible Sports alerts when Cosmic is not the active tab. Category preferences below still control which alerts qualify.</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">{label}</span></div>{state === "blocked" ? <p className="mt-3 text-xs text-amber-100/70">Notifications are blocked in browser settings.</p> : state === "unsupported" ? <p className="mt-3 text-xs text-white/45">Browser notifications are not supported here.</p> : state === "config-required" ? <p className="mt-3 text-xs text-white/45">Push is not configured in this environment.</p> : state === "reconnect" ? <p className="mt-3 text-xs text-amber-100/70">Cosmic could not confirm this device. Try reconnecting notifications.</p> : null}<div className="mt-3 flex flex-wrap gap-2">{state === "enabled" ? <><button type="button" disabled={busy} onClick={() => void disable()} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 disabled:opacity-50">Disable on this device</button><button type="button" disabled={busy} onClick={() => void sendTest()} className="rounded-lg border border-cyan-200/25 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50">Send test notification</button></> : <button type="button" disabled={busy || state === "loading" || state === "unsupported" || state === "blocked" || state === "config-required"} onClick={() => void enable()} className="rounded-lg border border-cyan-200/25 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50">{state === "reconnect" ? "Reconnect notifications" : "Enable notifications"}</button>}</div>{notice ? <p className="mt-2 text-xs text-white/55">{notice}</p> : null}</section>;
}
