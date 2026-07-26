"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import SchoolCurrent from "./SchoolCurrent";
import SchoolAssignments from "./SchoolAssignments";
import SchoolSchedule from "./SchoolSchedule";
import SchoolFooter from "./SchoolFooter";

export default function SchoolWidget() {
  return (
    <Widget
      accent="school"
    >
      <WidgetHeader
        title="School"
        subtitle="Academic Dashboard"
      />

      <WidgetBody>
        <SchoolCurrent />

        <SchoolAssignments />

        <SchoolSchedule />
      </WidgetBody>

      <WidgetFooter>
        <SchoolFooter />
      </WidgetFooter>
    </Widget>
  );
}