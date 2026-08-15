"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { WidgetEmpty, WidgetError, WidgetLoading } from "@/components/os/ui/widget";
import { useSchoolData } from "@/components/school/hooks/useSchoolData";
import { getCurrentAndNextClass } from "@/components/school/data/weeklySchedule";

import SchoolCurrent from "./SchoolCurrent";
import SchoolAssignments from "./SchoolAssignments";
import SchoolSchedule from "./SchoolSchedule";
import SchoolFooter from "./SchoolFooter";

export default function SchoolWidget() {
  const { size } = useWidgetContext();
  const { data, loading, error, local } = useSchoolData();
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
