import type { CalendarEvent } from "@/core/contracts";
import type {
  CalendarDateRange,
  CalendarProvider,
} from "@/engines/calendar";

import {
  normalizeCalDavCalendarData,
} from "./icalNormalizer";

import type { CalendarSubscription } from "./subscriptions";

const CACHE_DURATION_MS = 15 * 60 * 1000;

interface SubscriptionIcsCache {
  ics: string;
  expiresAt: number;
}

export class SubscriptionCalendarProvider
  implements CalendarProvider
{
  private readonly subscriptions: CalendarSubscription[];

  private cache = new Map<
    string,
    SubscriptionIcsCache
  >();

  private pending = new Map<
    string,
    Promise<string>
  >();

  constructor(
    subscriptions: CalendarSubscription[]
  ) {
    this.subscriptions =
      subscriptions.filter(
        (subscription) =>
          subscription.enabled &&
          subscription.url
      );
  }

  async getEvents(
    range?: CalendarDateRange
  ): Promise<CalendarEvent[]> {
    const now = new Date();

    const start =
      range?.start ??
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const end =
      range?.end ??
      new Date(
        start.getTime() +
          30 * 24 * 60 * 60 * 1000
      );

    const results = await Promise.allSettled(
      this.subscriptions.map((subscription) =>
        this.getSubscriptionEvents(
          subscription,
          start,
          end
        )
      )
    );

    const successfulResults = results.flatMap(
      (result, index) => {
        if (result.status === "fulfilled") {
          return [result.value];
        }

        const subscription = this.subscriptions[index];

        console.error(
          `Calendar subscription "${subscription.name}" (${subscription.id}) failed:`,
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown subscription error"
        );

        return [];
      }
    );

    return successfulResults
      .flat()
      .sort(
        (a, b) =>
          a.start.getTime() -
          b.start.getTime()
      );
  }

  private async getSubscriptionEvents(
    subscription: CalendarSubscription,
    start: Date,
    end: Date
  ): Promise<CalendarEvent[]> {
    const ics = await this.getSubscriptionIcs(
      subscription
    );

    const events = normalizeCalDavCalendarData(
      wrapIcsAsCalendarData(ics),
      {
        calendarName: subscription.name,
      },
      {
        start,
        end,
      }
    );

    return events.map((event) => ({
      ...event,
      id: `${subscription.id}:${event.id}`,
      calendarId: subscription.id,
      calendarName: subscription.name,
      source: "subscription" as const,
      category: subscription.category ?? "sports",
      priority: subscription.priority,
    }));
  }

  private async getSubscriptionIcs(
    subscription: CalendarSubscription
  ): Promise<string> {
    const cached = this.cache.get(subscription.id);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.ics;
    }

    const pending = this.pending.get(subscription.id);

    if (pending) {
      return pending;
    }

    const request = this.fetchSubscription(subscription).finally(
      () => {
        this.pending.delete(subscription.id);
      }
    );

    this.pending.set(subscription.id, request);

    return request;
  }

  private async fetchSubscription(
    subscription: CalendarSubscription
  ): Promise<string> {
    const response = await fetch(
      subscription.url,
      {
        cache: "no-store",
        headers: {
          Accept:
            "text/calendar, text/plain, */*",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Calendar subscription "${subscription.name}" failed: ${response.status} ${response.statusText}`
      );
    }

    const ics =
      await response.text();

    this.cache.set(
      subscription.id,
      {
        ics,
        expiresAt:
          Date.now() +
          CACHE_DURATION_MS,
      }
    );

    return ics;
  }
}

function wrapIcsAsCalendarData(
  ics: string
): string {
  return `
    <d:response>
      <d:propstat>
        <d:prop>
          <c:calendar-data><![CDATA[
${ics}
          ]]></c:calendar-data>
        </d:prop>
      </d:propstat>
    </d:response>
  `;
}
