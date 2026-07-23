"use client";

import DashboardGrid from "@/components/school/layout/DashboardGrid";
import DashboardItem from "@/components/school/layout/DashboardItem";
import SchoolDashboard from "@/components/school/layout/SchoolDashboard";
import SchoolHero from "@/components/school/hero/SchoolHero";
import FocusCard from "@/components/school/cards/FocusCard";
import TimelineCard from "@/components/school/cards/TimeLineCard";
import AcademicsCard from "@/components/school/cards/AcademicsCard";
import DeadlinesCard from "@/components/school/cards/DeadlinesCard";
import AFROTCCard from "@/components/school/cards/AFROTCCard";
import QuickActionsCard from "@/components/school/cards/QuickActionsCard";
import DailyBriefingCard from "@/components/school/cards/DailyBriefingCard";

import { useSchool } from "@/components/school/context/SchoolDataContext";
import AICoachCard from "@/components/school/cards/AICoachCard";
import NotificationsCard from "@/components/school/cards/NotificationsCard";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white">
      {title}
    </div>
  );
}

function SchoolContent() {
  const {
    data,
    intelligence,
    loading,
    error,
  } = useSchool();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-white/70">
        Loading School Dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-red-400">
        {error ?? "Unable to load school data."}
      </div>
    );
  }

  return (
    <DashboardGrid>
      <DashboardItem span={{ lg: 12 }}>
        <NotificationsCard
  notifications={intelligence!.notifications}
/>
      </DashboardItem>
      <DashboardItem span={{ lg: 12 }}>
  <SchoolHero
    data={data}
    intelligence={intelligence!}
  />
</DashboardItem>

<DashboardItem span={{ lg: 12 }}>
  <DailyBriefingCard
    briefing={intelligence!.briefing}
    plan={intelligence!.plan}
  />
</DashboardItem>

<DashboardItem span={{ lg: 4 }}>
  <QuickActionsCard />
</DashboardItem>

      <DashboardItem span={{ lg: 5 }}>
        <FocusCard
          plan={intelligence!.plan}
        />
      </DashboardItem>

      <DashboardItem span={{ lg: 7 }}>
        <TimelineCard
          timeline={intelligence!.timeline}
        />
      </DashboardItem>

      <DashboardItem span={{ lg: 4 }}>
        <AcademicsCard
          performance={intelligence!.performance}
          semester={data.semester}
        />
      </DashboardItem>

      <DashboardItem span={{ lg: 4 }}>
        <DeadlinesCard
          risks={intelligence!.risks}
        />
      </DashboardItem>

      <DashboardItem span={{ lg: 8 }}>
        <AICoachCard
          briefing={intelligence!.briefing}
          recommendations={intelligence!.recommendations}
          workload={intelligence!.workload}
        />
      </DashboardItem>

      <DashboardItem span={{ lg: 4 }}>
        <AFROTCCard />
      </DashboardItem>
    </DashboardGrid>
  );
}

export default function SchoolPage() {
  return (
    <SchoolDashboard>
      <SchoolContent />
    </SchoolDashboard>
  );
}