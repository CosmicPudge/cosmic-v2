export type SchoolPriority = "critical" | "high" | "normal";

export interface SchoolClass {
  id: string;
  courseCode: string;
  courseName: string;
  startsAt: string;
  endsAt: string;
  location: string;
  status: "upcoming" | "completed";
  accent: string;
}

export interface SchoolAssignment {
  id: string;
  courseCode: string;
  title: string;
  dueLabel: string;
  estimatedMinutes: number;
  status: "overdue" | "dueToday" | "submitted" | "upcoming";
  priority: SchoolPriority;
}

export interface SchoolDeadline {
  id: string;
  courseCode: string;
  title: string;
  dueLabel: string;
  countdown: string;
  priority: SchoolPriority;
}

export interface SchoolGrade {
  id: string;
  courseCode: string;
  assessment: string;
  score: string;
  letterGrade: string;
  receivedLabel: string;
}

export interface SchoolAnnouncement {
  id: string;
  courseCode: string;
  title: string;
  summary: string;
  publishedLabel: string;
  unread: boolean;
}

export interface SchoolRecommendation {
  id: string;
  title: string;
  explanation: string;
  actionLabel: string;
  href: string;
}

export interface SchoolQuickAction {
  id: string;
  href: string;
  label: string;
  icon: "assignment" | "schedule" | "courses" | "study";
}

export interface SchoolOverviewData {
  studentName: string;
  dateLabel: string;
  briefing: {
    summary: string;
    facts: string[];
    actionLabel: string;
    actionHref: string;
  };
  classes: SchoolClass[];
  assignments: SchoolAssignment[];
  deadlines: SchoolDeadline[];
  semester: {
    name: string;
    elapsedPercent: number;
    elapsedLabel: string;
    completedCredits: number;
    totalCredits: number;
  };
  academics: {
    currentGpa: string;
    termGpa: string;
    creditsEarned: number;
    creditsRemaining: number;
  };
  grades: SchoolGrade[];
  announcements: SchoolAnnouncement[];
  mission: {
    title: string;
    progressPercent: number;
    nextMilestone: string;
    impactLabel: string;
  };
  recommendations: SchoolRecommendation[];
  quickActions: SchoolQuickAction[];
}
