"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import BriefingGreeting from "./BriefingGreeting";
import BriefingSummary from "./BriefingSummary";
import BriefingAgenda from "./BriefingAgenda";
import BriefingFooter from "./BriefingFooter";

export default function BriefingWidget() {
  return (
    <Widget
      accent="briefing"
    >
      <WidgetHeader
        title="Daily Briefing"
        subtitle="Everything you need today"
      />

      <WidgetBody>
        <BriefingGreeting />

        <BriefingSummary />

        <BriefingAgenda />
      </WidgetBody>

      <WidgetFooter>
        <BriefingFooter />
      </WidgetFooter>
    </Widget>
  );
}