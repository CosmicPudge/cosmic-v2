import "server-only";

import { CosmicCore } from "./CosmicCore";

import { AppleCalendarProvider } from "@/services/calendar/appleCalendarProvider";
import { AppleCalendarWriter } from "@/services/calendar/appleCalendarWriter";
import { TestCalendarProvider } from "@/services/calendar/testCalendarProvider";
import { SubscriptionCalendarProvider } from "@/services/calendar/subscriptionCalendarProvider";
import { CombinedCalendarProvider } from "@/services/calendar/combinedCalendarProvider";
import { getCalendarSubscriptions } from "@/services/calendar/subscriptionConfig";
import { MailEngine } from "@/engines/mail";
import { getGmailToken, GmailProvider } from "@/services/mail/gmail";

const shouldUseAppleCalendar =
  process.env.COSMIC_CALENDAR_PROVIDER !== "test" &&
  Boolean(
    process.env.APPLE_CALENDAR_USERNAME
  ) &&
  Boolean(
    process.env.APPLE_CALENDAR_PASSWORD
  );

const appleProvider =
  shouldUseAppleCalendar
    ? new AppleCalendarProvider()
    : new TestCalendarProvider();

const appleCalendarWriter =
  shouldUseAppleCalendar
    ? new AppleCalendarWriter()
    : null;

const subscriptions =
  getCalendarSubscriptions();

const subscriptionProvider =
  subscriptions.length > 0
    ? new SubscriptionCalendarProvider(
        subscriptions
      )
    : null;

const calendarProvider =
  subscriptionProvider
    ? new CombinedCalendarProvider([
        appleProvider,
        subscriptionProvider,
      ])
    : appleProvider;

export const serverCosmic =
  new CosmicCore(calendarProvider);

export function getAppleCalendarWriter(): AppleCalendarWriter | null {
  return appleCalendarWriter;
}

export async function refreshAppleCalendarAfterWrite(): Promise<void> {
  if (appleProvider instanceof AppleCalendarProvider) {
    appleProvider.invalidateCache();
  }

  try {
    await serverCosmic.calendar.refresh();
  } catch (error) {
    // A subscription refresh must not turn a successful Apple CalDAV write
    // into a failed create response.
    console.error(
      "Calendar snapshot refresh after Apple write failed:",
      error instanceof Error ? error.message : "Unknown calendar error"
    );
  }
}

export function getServerMailEngine(): MailEngine | null {
  const token = getGmailToken();
  return token ? new MailEngine(new GmailProvider(token)) : null;
}
