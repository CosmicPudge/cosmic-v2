"use client";

import { useEffect } from "react";

import { cosmicBus } from "./EventBus";

export function useEventBus<T>(
  type: string,
  callback: (payload?: T) => void
) {
  useEffect(() => {
    const unsubscribe = cosmicBus.on(
      type,
      (event) => {
        callback(event.payload as T);
      }
    );

    return unsubscribe;
  }, [type, callback]);
}