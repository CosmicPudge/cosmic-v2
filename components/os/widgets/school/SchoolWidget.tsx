"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { WidgetEmpty, WidgetError, WidgetLoading } from "@/components/os/ui/widget";
import { useSchoolData } from "@/components/school/hooks/useSchoolData";
import { getCurrentAndNextClass } from "@/components/school/data/weeklySchedule";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";

import SchoolCurrent from "./SchoolCurrent";
import SchoolAssignments from "./SchoolAssignments";
import SchoolSchedule from "./SchoolSchedule";
import SchoolFooter from "./SchoolFooter";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";

export default function SchoolWidget() {
  const { size, presentation } = useWidgetContext();
  const { data, loading, error, local } = useSchoolData();
  const developer = useDeveloperKioskData();
  const activeTerm = local.data.terms.find((term) => term.active);
  const activeCourses = local.data.courses.filter((course) => !activeTerm || course.termId === activeTerm.id);
  const activeCourseIds = new Set(activeCourses.map((course) => course.id));
  const hasLocalData = Boolean(activeTerm || activeCourses.length || local.data.assignments.length);
  const localSchedule = getCurrentAndNextClass(activeCourses, activeTerm);
  const now = new Date();
  const nextClass = data?.classes
    .filter((schoolClass) => schoolClass.start > now)
    .sort((first, second) => first.start.getTime() - second.start.getTime())[0];
  const localAssignments = local.data.assignments
    .filter((assignment) => assignment.status !== "completed" && assignment.dueAt && (!assignment.courseId || activeCourseIds.has(assignment.courseId)))
    .map((assignment) => ({ id: assignment.id, title: assignment.title, due: new Date(assignment.dueAt!), completed: false, priority: assignment.priority, ...(assignment.courseId ? { course: local.data.courses.find((course) => course.id === assignment.courseId)?.name } : {}) }));
  const dueAssignments = [...(data?.assignments ?? []), ...localAssignments]
    .filter((assignment) => !assignment.completed)
    .sort((first, second) => first.due.getTime() - second.due.getTime());
  const upcomingClasses = data?.classes
    .filter((schoolClass) => schoolClass.start > now)
    .sort((first, second) => first.start.getTime() - second.start.getTime()) ?? [];
  const schoolHasSource = Boolean(data || hasLocalData);
  const schoolTitle = localSchedule.currentClass?.course.name ?? localSchedule.nextClass?.course.name ?? nextClass?.name ?? (error && !hasLocalData ? "School data unavailable." : schoolHasSource ? "Schedule is clear." : "No schedule connected.");
  const schoolSubtitle = localSchedule.currentClass ? "In progress" : nextClass ? `Next class · ${nextClass.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : error && !hasLocalData ? "Cosmic will reconnect automatically." : schoolHasSource ? "No upcoming classes" : "Connect a school source to show your schedule";
  if (presentation === "kiosk") {
    if (developer.data) {
      const assignment = developer.data.school.assignments[0];
      const backgroundState = developer.data.school.sceneState;
      return <KioskSceneFrame scene="school" backgroundState={backgroundState} eyebrow="COSMIC • SCHOOL" title={assignment?.title ?? (developer.data.school.connected ? "No upcoming assignments" : "School data unavailable")} subtitle={assignment ? `${assignment.course ?? "Assignment"} · Due ${new Date(assignment.due).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : developer.data.school.error ?? "Canvas is not configured for this kiosk."}><div className="kiosk-native-scene-details">{developer.data.school.overdueCount > 0 ? <span>{developer.data.school.overdueCount} overdue</span> : <span>{developer.data.school.assignments.length} upcoming assignments</span>}</div></KioskSceneFrame>;
    }
    return <KioskSceneFrame scene="school" backgroundState={dueAssignments.length ? "upcoming" : schoolHasSource ? "clear" : "unavailable"} eyebrow="COSMIC • SCHOOL" title={schoolTitle} subtitle={schoolSubtitle}><div className="kiosk-native-scene-details">{dueAssignments[0] ? <span>Due · {dueAssignments[0].title}</span> : schoolHasSource ? <span>No assignments due soon</span> : null}</div></KioskSceneFrame>;
  }
  return (
    <Widget
      accent="school"
    >
      <WidgetHeader
        title="School"
        subtitle={activeTerm?.name ?? data?.semester.semester ?? "Academic Dashboard"}
      />

      <WidgetBody scrollable={size === "large"}>
        {!local.ready || (loading && !hasLocalData) ? <WidgetLoading /> : error && !hasLocalData ? <WidgetError title="School unavailable" message={error} /> : !data && !hasLocalData ? <WidgetEmpty title="No school data yet" description="Add a School term or connect a school calendar to get started." /> : <>
          <SchoolCurrent term={activeTerm?.name ?? data?.semester.semester ?? "School"} nextClass={localSchedule.currentClass ? { id: localSchedule.currentClass.course.id, name: localSchedule.currentClass.course.name, start: localSchedule.currentClass.start, end: localSchedule.currentClass.end, location: localSchedule.currentClass.location } : localSchedule.nextClass ? { id: localSchedule.nextClass.course.id, name: localSchedule.nextClass.course.name, start: localSchedule.nextClass.start, end: localSchedule.nextClass.end, location: localSchedule.nextClass.location } : nextClass} isCurrentClass={Boolean(localSchedule.currentClass)} urgentAssignment={dueAssignments[0]} />
          {size !== "small" && <SchoolAssignments assignments={dueAssignments} />}
          {size === "large" && <SchoolSchedule classes={[...localSchedule.schedule.map((item) => ({ id: `${item.course.id}:${item.start.toISOString()}`, name: item.course.name, start: item.start, end: item.end, ...(item.location ? { location: item.location } : {}) })), ...upcomingClasses]} />}
        </>}
      </WidgetBody>

      <WidgetFooter>
        <SchoolFooter />
      </WidgetFooter>
    </Widget>
  );
}
