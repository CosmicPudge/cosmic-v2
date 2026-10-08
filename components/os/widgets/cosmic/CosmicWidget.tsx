"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";
import Link from "next/link";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";

export default function CosmicWidget() {
  const { presentation } = useWidgetContext();
  const kiosk = useDeveloperKioskData({ poll: presentation === "kiosk" });
  if (presentation === "kiosk") {
    const nextAssignment = kiosk.data?.school.assignments[0];
    const nextTask = kiosk.data?.projects.openTasks[0];
    const nextEvent = kiosk.data?.calendar.nextEvent;
    const title = nextAssignment?.title ?? nextTask?.title ?? nextEvent?.title ?? "You are caught up.";
    const subtitle = nextAssignment ? `Next school priority · ${new Date(nextAssignment.due).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}` : nextTask ? `Next project task${nextTask.projectTitle ? ` · ${nextTask.projectTitle}` : ""}` : nextEvent ? `Next event · ${new Date(nextEvent.start).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}` : "Cosmic found no immediate priorities.";
    return <KioskSceneFrame scene="ai" eyebrow="COSMIC • AI" title={kiosk.loading ? "Building your briefing." : title} subtitle={subtitle} />;
  }
  return (
    <Widget
      accent="cosmic"
    >
      <WidgetHeader
        title="Cosmic"
        subtitle="Your intelligent workspace"
      />

      <WidgetBody><WidgetEmpty title="Cosmic AI is ready" description="Open Cosmic AI to ask a real question or provide a source." /></WidgetBody>

      <WidgetFooter><Link href="/ai" className="text-xs text-cyan-100">Open Cosmic AI</Link></WidgetFooter>
    </Widget>
  );
}
