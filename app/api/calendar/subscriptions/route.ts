import { getCalendarSubscriptions } from "@/services/calendar/subscriptionConfig";
import { SubscriptionCalendarProvider } from "@/services/calendar/subscriptionCalendarProvider";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  const subscriptions =
    getCalendarSubscriptions();

  const provider =
    new SubscriptionCalendarProvider(
      subscriptions
    );

  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  const results = await Promise.all(
    subscriptions.map(
      async (subscription) => {
        try {
          const events =
            await provider.getEvents({
              start,
              end,
            });

          const matchingEvents =
            events.filter(
              (event) =>
                event.calendarName ===
                subscription.name
            );

          return {
            id: subscription.id,
            name: subscription.name,
            enabled: subscription.enabled,
            priority: subscription.priority,
            success: true,
            eventCount:
              matchingEvents.length,
            events:
              matchingEvents
                .slice(0, 10)
                .map((event) => ({
                  id: event.id,
                  title: event.title,
                  start:
                    event.start.toISOString(),
                  end:
                    event.end.toISOString(),
                  calendarName:
                    event.calendarName,
                  source: event.source,
                  priority: event.priority,
                })),
          };
        } catch (error) {
          return {
            id: subscription.id,
            name: subscription.name,
            enabled: subscription.enabled,
            priority: subscription.priority,
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Unknown subscription error",
          };
        }
      }
    )
  );

  return Response.json({
    subscriptionCount:
      subscriptions.length,
    subscriptions: results,
  });
}
