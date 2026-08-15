import type { Course, SchoolTerm } from "@/core/contracts/School";

export interface ScheduledClass {
  course: Course;
  start: Date;
  end: Date;
  location?: string;
}

function atTime(date: Date, time: string): Date | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
}

function withinTerm(date: Date, term?: SchoolTerm): boolean {
  if (!term) return true;
  const start = term.startDate ? new Date(term.startDate) : undefined;
  const end = term.endDate ? new Date(term.endDate) : undefined;
  return (!start || date >= start) && (!end || date <= end);
}

export function getWeeklySchedule(courses: Course[], term?: SchoolTerm, now = new Date()): ScheduledClass[] {
  const instances: ScheduledClass[] = [];
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let offset = 0; offset < 8; offset += 1) {
    const date = new Date(day); date.setDate(day.getDate() + offset);
    if (!withinTerm(date, term)) continue;
    for (const course of courses) for (const meeting of course.meetingTimes) {
      if (meeting.weekday !== date.getDay()) continue;
      const start = atTime(date, meeting.startTime); const end = atTime(date, meeting.endTime);
      if (start && end && end > start) instances.push({ course, start, end, ...(meeting.location ?? course.location ? { location: meeting.location ?? course.location } : {}) });
    }
  }
  return instances.sort((first, second) => first.start.getTime() - second.start.getTime());
}

export function getCurrentAndNextClass(courses: Course[], term?: SchoolTerm, now = new Date()) {
  const schedule = getWeeklySchedule(courses, term, now);
  return {
    currentClass: schedule.find((item) => item.start <= now && item.end > now),
    nextClass: schedule.find((item) => item.start > now),
    schedule,
  };
}
