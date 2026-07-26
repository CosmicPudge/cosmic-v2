"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import CalendarToday from "./CalendarToday";
import CalendarUpcoming from "./CalendarUpcoming";
import CalendarAgenda from "./CalendarAgenda";
import CalendarFooter from "./CalendarFooter";

export default function CalendarWidget() {
  return (
    <Widget
      accent="calendar"
    >
      <WidgetHeader
        title="Calendar"
        subtitle="Today's schedule"
      />

      <WidgetBody>
        <CalendarToday />

        <CalendarUpcoming />

        <CalendarAgenda />
      </WidgetBody>

      <WidgetFooter>
        <CalendarFooter />
      </WidgetFooter>
    </Widget>
  );
}