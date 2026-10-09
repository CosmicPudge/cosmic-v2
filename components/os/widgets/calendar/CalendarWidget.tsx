"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";

import CalendarToday from "./CalendarToday";
import CalendarUpcoming from "./CalendarUpcoming";
import CalendarAgenda from "./CalendarAgenda";
import CalendarFooter from "./CalendarFooter";
import KioskCalendarScene from "./KioskCalendarScene";

import useCalendar from "@/hooks/os/useCalendar";
import { useDashboardWidgetReadiness } from "@/components/dashboard/readiness/DashboardReadiness";
import { dashboardImage } from "@/components/dashboard/images/dashboardImageManifest";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import type { CalendarEventCategory } from "@/core/contracts";

export default function CalendarWidget() {
  const { size, presentation } = useWidgetContext();
  const {
    calendar,
    loading,
    error,
  } = useCalendar({
    enabled:
      typeof window === "undefined" ||
      window.location.pathname !== "/kiosk" ||
      ["localhost", "127.0.0.1"].includes(window.location.hostname),
    includeSchool: false,
  });
  const developer = useDeveloperKioskData();
  const developerCalendar = developer.data ? {
    today: developer.data.calendar.todayEvents.map(hydrateDeveloperEvent),
    upcoming: developer.data.calendar.weekEvents.map(hydrateDeveloperEvent),
    nextEvent: developer.data.calendar.nextEvent ? hydrateDeveloperEvent(developer.data.calendar.nextEvent) : undefined,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    accountCalendarConnected: developer.data.calendar.connected,
  } : null;
  const visibleCalendar = presentation === "kiosk"
    ? (developerCalendar?.accountCalendarConnected ? developerCalendar : null)
    : calendar;
  useDashboardWidgetReadiness("calendar", loading ? "loading" : error && !calendar ? "degraded" : "ready");

  if (presentation === "kiosk") {
    return <KioskCalendarScene
      calendar={visibleCalendar}
      loading={!visibleCalendar && developer.loading}
      error={developer.data?.calendar.connected ? null : (developer.data?.calendar.error ?? developer.error ?? "Calendar connection unavailable")}
    />;
  }

  return (
    <Widget accent="calendar" imageUrl={dashboardImage("calendar").src} imageOpacity={.72} imageBlur={0}>
      <WidgetHeader
        title="Calendar"
        subtitle="Today's schedule"
        className="mb-3"
      />

      <WidgetBody
        scrollable={size === "large"}
        className={
          size === "small"
            ? "grid min-h-0 grid-cols-1 gap-2"
            : "grid min-h-0 grid-cols-2 grid-rows-[auto_minmax(0,1fr)] gap-2"
        }
      >
        {size !== "small" && (
          <div className="min-h-0">
            <CalendarToday />
          </div>
        )}

        <div className="min-h-0">
          <CalendarUpcoming
            events={calendar?.upcoming ?? []}
            nextEvent={calendar?.nextEvent}
            loading={loading}
          />
        </div>

        {size !== "small" && (
          <div className="col-span-2 min-h-0 overflow-hidden">
            <CalendarAgenda
              events={calendar?.today ?? []}
              currentEvent={calendar?.currentEvent}
              loading={loading}
              error={error}
              kiosk={false}
            />
          </div>
        )}
      </WidgetBody>

      <WidgetFooter>
        <CalendarFooter />
      </WidgetFooter>
    </Widget>
  );
}

function hydrateDeveloperEvent(event: { id: string; title: string; start: string; end: string; allDay: boolean; location?: string; calendar?: string; category?: CalendarEventCategory }) {
  return { ...event, start: new Date(event.start), end: new Date(event.end), travelRequired: false, completed: false, ...(event.calendar ? { calendarName: event.calendar } : {}) };
}
