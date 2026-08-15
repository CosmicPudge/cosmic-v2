import type { CalendarSubscription } from "./subscriptions";

const DEFAULT_SUBSCRIPTIONS: CalendarSubscription[] = [];

export function getCalendarSubscriptions(): CalendarSubscription[] {
  const raw =
    process.env.COSMIC_CALENDAR_SUBSCRIPTIONS;

  if (!raw) {
    return DEFAULT_SUBSCRIPTIONS;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error(
        "COSMIC_CALENDAR_SUBSCRIPTIONS must be an array."
      );
    }

    return parsed.filter(
      (item): item is CalendarSubscription =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.url === "string" &&
        typeof item.enabled === "boolean" &&
        (item.priority === "low" ||
          item.priority === "normal" ||
          item.priority === "high") &&
        (item.category === undefined ||
          item.category === "personal" ||
          item.category === "school" ||
          item.category === "sports")
    );
  } catch (error) {
    console.error(
      "Cosmic calendar subscription configuration is invalid:",
      error instanceof Error
        ? error.message
        : "Unknown configuration error"
    );

    return DEFAULT_SUBSCRIPTIONS;
  }
}
