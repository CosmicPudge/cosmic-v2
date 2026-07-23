import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flag,
  GraduationCap,
  Shield,
  Target,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import {
  FocusCategory,
  FocusPriority,
  FocusStatus,
  FocusTask,
} from "./focusTypes";

export interface FocusAppearance {
  icon: LucideIcon;
  iconClass: string;
  accentClass: string;
  borderClass: string;
  glowClass: string;
}

const priorityAppearance: Record<
  FocusPriority,
  FocusAppearance
> = {
  low: {
    icon: CheckCircle2,
    iconClass: "text-emerald-300",
    accentClass: "bg-emerald-400",
    borderClass: "border-emerald-500/20",
    glowClass:
      "from-emerald-500/10 via-transparent to-transparent",
  },

  medium: {
    icon: Clock,
    iconClass: "text-sky-300",
    accentClass: "bg-sky-400",
    borderClass: "border-sky-500/20",
    glowClass:
      "from-sky-500/10 via-transparent to-transparent",
  },

  high: {
    icon: Flag,
    iconClass: "text-orange-300",
    accentClass: "bg-orange-400",
    borderClass: "border-orange-500/20",
    glowClass:
      "from-orange-500/10 via-transparent to-transparent",
  },

  critical: {
    icon: TriangleAlert,
    iconClass: "text-red-300",
    accentClass: "bg-red-400",
    borderClass: "border-red-500/20",
    glowClass:
      "from-red-500/10 via-transparent to-transparent",
  },
};

const categoryIcons: Record<
  FocusCategory,
  LucideIcon
> = {
  assignment: ClipboardList,
  exam: GraduationCap,
  quiz: BookOpen,
  project: Target,
  study: BookOpen,
  reading: BookOpen,
  meeting: Calendar,
  afrotc: Shield,
  personal: CheckCircle2,
};

const categoryLabels: Record<
  FocusCategory,
  string
> = {
  assignment: "Assignment",
  exam: "Exam",
  quiz: "Quiz",
  project: "Project",
  study: "Study",
  reading: "Reading",
  meeting: "Meeting",
  afrotc: "AFROTC",
  personal: "Personal",
};

const priorityWeight: Record<
  FocusPriority,
  number
> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const statusWeight: Record<
  FocusStatus,
  number
> = {
  "in-progress": 4,
  "not-started": 3,
  blocked: 2,
  completed: 1,
};

export function getPriorityAppearance(
  priority: FocusPriority
): FocusAppearance {
  return priorityAppearance[priority];
}

export function getCategoryIcon(
  category: FocusCategory
): LucideIcon {
  return categoryIcons[category];
}

export function getCategoryLabel(
  category: FocusCategory
): string {
  return categoryLabels[category];
}

export function sortFocusTasks(
  tasks: FocusTask[]
): FocusTask[] {
  return [...tasks].sort((a, b) => {
    const priorityDifference =
      priorityWeight[b.priority] -
      priorityWeight[a.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (
      statusWeight[b.status] -
      statusWeight[a.status]
    );
  });
}

export function formatMinutes(
  minutes: number
): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

export function getProgressLabel(
  progress: number
): string {
  if (progress >= 100) {
    return "Completed";
  }

  if (progress >= 75) {
    return "Almost Done";
  }

  if (progress >= 40) {
    return "In Progress";
  }

  if (progress > 0) {
    return "Getting Started";
  }

  return "Not Started";
}