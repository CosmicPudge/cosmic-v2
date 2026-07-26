"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import SystemOverview from "./SystemOverview";
import SystemPerformance from "./SystemPerformance";
import SystemStorage from "./SystemStorage";
import SystemFooter from "./SystemFooter";

export default function SystemWidget() {
  return (
    <Widget
      accent="system"
    >
      <WidgetHeader
        title="System"
        subtitle="Device Status"
      />

      <WidgetBody>
        <SystemOverview />

        <SystemPerformance />

        <SystemStorage />
      </WidgetBody>

      <WidgetFooter>
        <SystemFooter />
      </WidgetFooter>
    </Widget>
  );
}