import {
  SchoolAssignment,
  SchoolClass,
} from "../types";

export interface TodaySummary {
  greeting: string;

  classesRemaining: number;

  assignmentsRemaining: number;

  homeworkHours: number;

  workload: "light" | "moderate" | "heavy";

  nextClass?: SchoolClass;

  nextAssignment?: SchoolAssignment;
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

export function buildToday(
  nextClass: SchoolClass | undefined,
  nextAssignment: SchoolAssignment | undefined,
  upcomingClasses: SchoolClass[],
  assignments: SchoolAssignment[]
): TodaySummary {

  const remainingAssignments =
    assignments.filter(a => !a.completed);

  const homeworkHours =
    remainingAssignments.length * 1.25;

  let workload: TodaySummary["workload"] =
    "light";

  if (homeworkHours >= 4)
    workload = "heavy";
  else if (homeworkHours >= 2)
    workload = "moderate";

  return {

    greeting: greeting(),

    classesRemaining:
      upcomingClasses.length,

    assignmentsRemaining:
      remainingAssignments.length,

    homeworkHours,

    workload,

    nextClass,

    nextAssignment,

  };

}