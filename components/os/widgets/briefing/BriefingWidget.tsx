"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";
import { useEntitlements } from "@/hooks/os/useEntitlements";
import { useSchoolData } from "@/components/school/hooks/useSchoolData";

export default function BriefingWidget() {
  const { presentation } = useWidgetContext();
  const { data: entitlements } = useEntitlements();
  const school = useSchoolData({ enabled: entitlements.features["school.basic"] });
  const nextAssignment = school.snapshot?.actionItems.find((item) => item.due >= new Date());
  const sourceAction = school.snapshot?.sourceIntelligence?.actionItems.find((item) => item.status !== "completed");
  const briefingTitle = school.loading ? "Preparing your day." : nextAssignment ? `Next assignment · ${nextAssignment.title}` : sourceAction ? sourceAction.title : "Your day, at a glance.";
  const briefingSubtitle = nextAssignment ? `Due ${nextAssignment.due.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : sourceAction ? "From a School source · review recommended" : school.snapshot?.sourceStatus?.canvas === "error" ? "School data is temporarily unavailable." : "No upcoming School deadlines.";
  if (presentation === "kiosk") return <KioskSceneFrame scene="briefing" eyebrow="COSMIC • DAILY BRIEFING" title={briefingTitle} subtitle={briefingSubtitle} />;
  return (
    <Widget
      accent="briefing"
    >
      <WidgetHeader
        title="Daily Briefing"
        subtitle="Everything you need today"
      />

      <WidgetBody>{school.snapshot?.actionItems.length ? <div className="space-y-2"><p className="text-xs uppercase tracking-widest text-fuchsia-100/50">School</p>{school.snapshot.actionItems.slice(0, 3).map((item) => <p key={item.id} className="truncate text-sm text-white/70">{item.title} · due {item.due.toLocaleDateString([], { month: "short", day: "numeric" })}</p>)}</div> : <WidgetEmpty title="Briefing data unavailable" description="Open Daily Briefing when your schedule and sources are ready." />}</WidgetBody>

      <WidgetFooter><span className="text-xs text-fuchsia-100/70">Briefing source unavailable</span></WidgetFooter>
    </Widget>
  );
}
