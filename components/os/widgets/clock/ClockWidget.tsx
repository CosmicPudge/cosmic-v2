"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import ClockCurrent from "./ClockCurrent";
import ClockDate from "./ClockDate";
import ClockWorld from "./ClockWorld";
import ClockFooter from "./ClockFooter";

export default function ClockWidget() {
  return (
    <Widget
      accent="clock"
    >
      <WidgetHeader
        title="Clock"
        subtitle="Current Time"
      />

      <WidgetBody>
        <ClockCurrent />

        <ClockDate />

        <ClockWorld />
      </WidgetBody>

      <WidgetFooter>
        <ClockFooter />
      </WidgetFooter>
    </Widget>
  );
}