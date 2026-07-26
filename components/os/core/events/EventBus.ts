import type { CosmicEvent } from "./EventTypes";

export type EventListener = (
  event: CosmicEvent
) => void;

export class EventBus {
  private listeners = new Map<
    string,
    Set<EventListener>
  >();

  emit(event: CosmicEvent) {
    const listeners = this.listeners.get(
      event.type
    );

    if (!listeners) {
      return;
    }

    listeners.forEach((listener) =>
      listener(event)
    );
  }

  on(
    type: string,
    listener: EventListener
  ) {
    let listeners = this.listeners.get(type);

    if (!listeners) {
      listeners = new Set<EventListener>();

      this.listeners.set(type, listeners);
    }

    listeners.add(listener);

    return () => {
      listeners?.delete(listener);

      if (listeners?.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  off(
    type: string,
    listener: EventListener
  ) {
    const listeners =
      this.listeners.get(type);

    listeners?.delete(listener);

    if (listeners?.size === 0) {
      this.listeners.delete(type);
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const cosmicBus =
  new EventBus();