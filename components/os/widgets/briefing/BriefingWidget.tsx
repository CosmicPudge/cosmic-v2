"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";

export default function BriefingWidget() {
  return (
    <Widget
      accent="briefing"
    >
      <WidgetHeader
        title="Daily Briefing"
        subtitle="Everything you need today"
      />

      <WidgetBody><WidgetEmpty title="Briefing data unavailable" description="Open Daily Briefing when your schedule and sources are ready." /></WidgetBody>

      <WidgetFooter><span className="text-xs text-fuchsia-100/70">Briefing source unavailable</span></WidgetFooter>
    </Widget>
  );
}
