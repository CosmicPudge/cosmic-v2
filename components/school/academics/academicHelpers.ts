import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  AcademicsData,
  AcademicsState,
  Course,
  LetterGrade,
  StandingStatus,
} from "./academicTypes";

export interface StandingAppearance {
  icon: any;
  colorClass: string;
  borderClass: string;
  backgroundClass: string;
}

const STANDING_APPEARANCE: Record<
  StandingStatus,
  StandingAppearance
> = {
  excellent: {
    icon: Award,
    colorClass: "text-emerald-300",
    borderClass: "border-emerald-500/20",
    backgroundClass: "bg-emerald-500/10",
  },

  good: {
    icon: CheckCircle2,
    colorClass: "text-cyan-300",
    borderClass: "border-cyan-500/20",
    backgroundClass: "bg-cyan-500/10",
  },

  warning: {
    icon: TrendingDown,
    colorClass: "text-amber-300",
    borderClass: "border-amber-500/20",
    backgroundClass: "bg-amber-500/10",
  },

  critical: {
    icon: AlertTriangle,
    colorClass: "text-red-300",
    borderClass: "border-red-500/20",
    backgroundClass: "bg-red-500/10",
  },
};

export function getStandingAppearance(
  standing: StandingStatus
): StandingAppearance {
  return STANDING_APPEARANCE[standing];
}

export function buildAcademics(
  data: AcademicsData
): AcademicsState {
  const courses = [...data.courses].sort(
    (a, b) => b.grade.percentage - a.grade.percentage
  );

  const highestCourse = courses.at(0);

  const lowestCourse =
    courses.length > 0
      ? courses[courses.length - 1]
      : undefined;

  const averageGrade =
    courses.length === 0
      ? 0
      : Math.round(
          courses.reduce(
            (sum, course) =>
              sum + course.grade.percentage,
            0
          ) / courses.length
        );

  const assignmentCompletion =
    data.semester.totalAssignments === 0
      ? 0
      : Math.round(
          (data.semester.completedAssignments /
            data.semester.totalAssignments) *
            100
        );

  const creditCompletion =
    data.semester.creditsTotal === 0
      ? 0
      : Math.round(
          (data.semester.creditsCompleted /
            data.semester.creditsTotal) *
            100
        );

  return {
    semester: data.semester,

    courses,

    highestCourse,

    lowestCourse,

    averageGrade,

    assignmentCompletion,

    creditCompletion,
  };
}

export function getLetterColor(
  letter: LetterGrade
): string {
  if (letter.startsWith("A")) {
    return "text-emerald-300";
  }

  if (letter.startsWith("B")) {
    return "text-cyan-300";
  }

  if (letter.startsWith("C")) {
    return "text-amber-300";
  }

  if (letter.startsWith("D")) {
    return "text-orange-300";
  }

  return "text-red-300";
}

export function getGradeProgressColor(
  percentage: number
): string {
  if (percentage >= 90) {
    return "from-emerald-500 to-emerald-300";
  }

  if (percentage >= 80) {
    return "from-cyan-500 to-sky-400";
  }

  if (percentage >= 70) {
    return "from-amber-500 to-yellow-300";
  }

  return "from-red-500 to-orange-400";
}

export function getCourseTrend(
  course: Course
): "up" | "down" | "stable" {
  if (course.grade.percentage >= 90) {
    return "up";
  }

  if (course.grade.percentage < 75) {
    return "down";
  }

  return "stable";
}

export function getCourseTrendIcon(
  course: Course
) {
  const trend = getCourseTrend(course);

  switch (trend) {
    case "up":
      return TrendingUp;

    case "down":
      return TrendingDown;

    default:
      return BookOpen;
  }
}

export function formatGPA(
  gpa: number
): string {
  return gpa.toFixed(2);
}

export function formatPercentage(
  value: number
): string {
  return `${Math.round(value)}%`;
}