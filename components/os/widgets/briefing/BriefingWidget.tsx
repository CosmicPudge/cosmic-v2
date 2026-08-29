"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";

export default function BriefingWidget() {
  const { presentation } = useWidgetContext();
  if (presentation === "kiosk") return <KioskSceneFrame scene="briefing" eyebrow="COSMIC • DAILY BRIEFING" title="Your day, at a glance." subtitle="Briefing sources are not configured yet." />;
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
