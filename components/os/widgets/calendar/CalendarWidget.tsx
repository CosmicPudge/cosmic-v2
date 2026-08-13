"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import CalendarToday from "./CalendarToday";
import CalendarUpcoming from "./CalendarUpcoming";
import CalendarAgenda from "./CalendarAgenda";
import CalendarFooter from "./CalendarFooter";

import useCalendar from "@/hooks/os/useCalendar";

export default function CalendarWidget() {
  const {
    calendar,
    loading,
    error,
  } = useCalendar();

  return (
    <Widget accent="calendar">
      <WidgetHeader
        title="Calendar"
        subtitle="Today's schedule"
        className="mb-3"
      />

      <WidgetBody className="grid min-h-0 grid-cols-2 grid-rows-[auto_minmax(0,1fr)] gap-2">
  <div className="min-h-0">
    <CalendarToday />
  </div>

  <div className="min-h-0">
    <CalendarUpcoming
      events={calendar?.upcoming ?? []}
      loading={loading}
    />
  </div>

  <div className="col-span-2 min-h-0 overflow-hidden">
    <CalendarAgenda
      events={calendar?.today ?? []}
      loading={loading}
      error={error}
    />
  </div>
</WidgetBody>

      <WidgetFooter>
        <CalendarFooter />
      </WidgetFooter>
    </Widget>
  );
}