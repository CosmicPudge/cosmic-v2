import type { SchoolOverviewData } from "@/lib/school/types";
import { AIRecommendationsCard } from "./AIRecommendationsCard";
import { AnnouncementsCard } from "./AnnouncementsCard";
import { DailyBriefingCard } from "./DailyBriefingCard";
import { GPAAndCreditsCard } from "./GPAAndCreditsCard";
import { MissionProgressCard } from "./MissionProgressCard";
import { QuickActionsCard } from "./QuickActionsCard";
import { RecentGradesCard } from "./RecentGradesCard";
import { SemesterProgressCard } from "./SemesterProgressCard";
import { TodayAssignmentsCard } from "./TodayAssignmentsCard";
import { TodayClassesCard } from "./TodayClassesCard";
import { UpcomingDeadlinesCard } from "./UpcomingDeadlinesCard";

export function OverviewGrid({ data }: { data: SchoolOverviewData }) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <DailyBriefingCard studentName={data.studentName} dateLabel={data.dateLabel} briefing={data.briefing} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(21rem,0.75fr)] xl:gap-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          <TodayClassesCard classes={data.classes} />
          <TodayAssignmentsCard assignments={data.assignments} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <SemesterProgressCard semester={data.semester} />
          <GPAAndCreditsCard academics={data.academics} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        <UpcomingDeadlinesCard deadlines={data.deadlines} />
        <RecentGradesCard grades={data.grades} />
        <MissionProgressCard mission={data.mission} />
        <AnnouncementsCard announcements={data.announcements} />
        <AIRecommendationsCard recommendations={data.recommendations} />
        <QuickActionsCard actions={data.quickActions} />
      </div>
    </div>
  );
}
