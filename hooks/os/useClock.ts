"use client";

import { useCallback, useSyncExternalStore } from "react";

interface Subscriber {
  listener: () => void;
  precision: number;
  nextUpdate: number;
}

const subscribers = new Set<Subscriber>();
let snapshot: number | null = null;
let scheduler: number | null = null;
let visibilityAttached = false;

function publish(force = false) {
  const now = Date.now();
  const due = [...subscribers].filter((subscriber) => force || now >= subscriber.nextUpdate);
  if (due.length === 0) return;

  snapshot = now;
  due.forEach((subscriber) => {
    subscriber.nextUpdate = now + subscriber.precision;
    subscriber.listener();
  });
}

function schedule() {
  if (scheduler !== null) window.clearTimeout(scheduler);
  if (subscribers.size === 0) {
    scheduler = null;
    return;
  }

  const precision = Math.min(...[...subscribers].map((subscriber) => subscriber.precision));
  scheduler = window.setTimeout(() => {
    publish();
    schedule();
  }, precision);
}

function handleVisibilityChange() {
  if (!document.hidden) publish(true);
}

function subscribe(listener: () => void, precision: number) {
  const subscriber: Subscriber = {
    listener,
    precision: Math.max(100, precision),
    nextUpdate: 0,
  };
  subscribers.add(subscriber);

  if (!visibilityAttached) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityAttached = true;
  }

  window.setTimeout(() => publish(true), 0);
  schedule();

  return () => {
    subscribers.delete(subscriber);
    schedule();
    if (subscribers.size === 0 && visibilityAttached) {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      visibilityAttached = false;
      snapshot = null;
    }
  };
}

export function useClockTick(precision = 1_000) {
  const subscribeAtPrecision = useCallback(
    (listener: () => void) => subscribe(listener, precision),
    [precision],
  );

  return useSyncExternalStore(
    subscribeAtPrecision,
    () => snapshot,
    () => null,
  );
}

export default function useClock() {
  const now = useClockTick(1_000);
  return now === null ? null : new Date(now);
}
