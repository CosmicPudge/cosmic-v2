"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";

export default function BriefingWidget() {
  const { presentation } = useWidgetContext();
  return (
    <Widget
      accent="briefing"
    >
      <WidgetHeader
        title="Daily Briefing"
        subtitle="Everything you need today"
      />

      <WidgetBody><WidgetEmpty title={presentation === "kiosk" ? "Briefing not configured" : "Briefing data unavailable"} description="Open Daily Briefing when your schedule and sources are ready." /></WidgetBody>

      <WidgetFooter><span className="text-xs text-fuchsia-100/70">{presentation === "kiosk" ? "Configure sources in Briefing" : "Briefing source unavailable"}</span></WidgetFooter>
    </Widget>
  );
}
