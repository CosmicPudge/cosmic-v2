import type { SchoolOverviewData } from "./types";

const developmentOverviewData: SchoolOverviewData = {
  studentName: "Alex",
  dateLabel: "Wednesday, September 16",
  briefing: {
    summary:
      "You have two assignments due today and a focused afternoon ahead. Your Physics lab report is the highest-impact task before tomorrow's exam review.",
    facts: [
      "Your next class starts in 47 minutes.",
      "Two assignments are due before midnight.",
      "An 84% on your next Physics exam keeps your A.",
    ],
    actionLabel: "Plan my afternoon",
    actionHref: "/school/schedule",
  },
  classes: [
    {
      id: "phys-101",
      courseCode: "PHYS 101",
      courseName: "General Physics I",
      startsAt: "10:30 AM",
      endsAt: "11:45 AM",
      location: "Science Hall · 204",
      status: "upcoming",
      accent: "bg-sky-300",
    },
    {
      id: "math-221",
      courseCode: "MATH 221",
      courseName: "Calculus III",
      startsAt: "1:00 PM",
      endsAt: "2:15 PM",
      location: "North Hall · 118",
      status: "upcoming",
      accent: "bg-violet-300",
    },
    {
      id: "afrotc-201",
      courseCode: "AS 201",
      courseName: "AFROTC Leadership Lab",
      startsAt: "4:00 PM",
      endsAt: "5:30 PM",
      location: "Leadership Center",
      status: "upcoming",
      accent: "bg-amber-200",
    },
    {
      id: "eng-220",
      courseCode: "ENG 220",
      courseName: "Technical Writing",
      startsAt: "8:00 AM",
      endsAt: "9:15 AM",
      location: "Online",
      status: "completed",
      accent: "bg-emerald-300",
    },
  ],
  assignments: [
    {
      id: "lab-report",
      courseCode: "PHYS 101",
      title: "Lab report: Conservation of Energy",
      dueLabel: "Due today · 11:59 PM",
      estimatedMinutes: 75,
      status: "dueToday",
      priority: "high",
    },
    {
      id: "problem-set",
      courseCode: "MATH 221",
      title: "Problem set 4",
      dueLabel: "Due today · 11:59 PM",
      estimatedMinutes: 45,
      status: "dueToday",
      priority: "normal",
    },
    {
      id: "reading-response",
      courseCode: "ENG 220",
      title: "Reading response: Clarity in technical prose",
      dueLabel: "Submitted · Awaiting review",
      estimatedMinutes: 20,
      status: "submitted",
      priority: "normal",
    },
  ],
  deadlines: [
    {
      id: "physics-exam",
      courseCode: "PHYS 101",
      title: "Mechanics Exam",
      dueLabel: "Friday, September 18 · 4:00 PM",
      countdown: "2 days",
      priority: "high",
    },
    {
      id: "scholarship-essay",
      courseCode: "AFROTC",
      title: "Scholarship essay draft",
      dueLabel: "Monday, September 21 · 5:00 PM",
      countdown: "5 days",
      priority: "normal",
    },
    {
      id: "calculus-project",
      courseCode: "MATH 221",
      title: "Vector fields project proposal",
      dueLabel: "Friday, September 25 · 11:59 PM",
      countdown: "9 days",
      priority: "normal",
    },
  ],
  semester: {
    name: "Fall 2026",
    elapsedPercent: 38,
    elapsedLabel: "Week 6 of 16",
    completedCredits: 6,
    totalCredits: 16,
  },
  academics: {
    currentGpa: "3.82",
    termGpa: "3.91",
    creditsEarned: 48,
    creditsRemaining: 72,
  },
  grades: [
    {
      id: "grade-1",
      courseCode: "PHYS 101",
      assessment: "Kinematics quiz",
      score: "46 / 50",
      letterGrade: "A−",
      receivedLabel: "Today",
    },
    {
      id: "grade-2",
      courseCode: "MATH 221",
      assessment: "Problem set 3",
      score: "98 / 100",
      letterGrade: "A",
      receivedLabel: "Yesterday",
    },
    {
      id: "grade-3",
      courseCode: "ENG 220",
      assessment: "Memo revision",
      score: "94 / 100",
      letterGrade: "A",
      receivedLabel: "Sep 12",
    },
    {
      id: "grade-4",
      courseCode: "AS 201",
      assessment: "Leadership reflection",
      score: "19 / 20",
      letterGrade: "A",
      receivedLabel: "Sep 10",
    },
    {
      id: "grade-5",
      courseCode: "PHYS 101",
      assessment: "Lab preparation",
      score: "18 / 20",
      letterGrade: "A−",
      receivedLabel: "Sep 9",
    },
  ],
  announcements: [
    {
      id: "announcement-1",
      courseCode: "PHYS 101",
      title: "Exam review materials are available",
      summary: "Practice problems and the review guide are now posted in Resources.",
      publishedLabel: "42 min ago",
      unread: true,
    },
    {
      id: "announcement-2",
      courseCode: "AS 201",
      title: "Friday uniform inspection",
      summary: "Please arrive ten minutes early with service dress prepared.",
      publishedLabel: "Yesterday",
      unread: true,
    },
    {
      id: "announcement-3",
      courseCode: "MATH 221",
      title: "Office hours moved to Thursday",
      summary: "This week's office hours will be held in North Hall 204.",
      publishedLabel: "Monday",
      unread: false,
    },
  ],
  mission: {
    title: "AFROTC Field Training Readiness",
    progressPercent: 42,
    nextMilestone: "Submit scholarship essay outline",
    impactLabel: "Completing it moves you to 46%.",
  },
  recommendations: [
    {
      id: "recommendation-1",
      title: "Protect an hour for Physics",
      explanation:
        "A focused review block before your lab report gives you the best margin for Friday's exam.",
      actionLabel: "Add study block",
      href: "/school/schedule",
    },
    {
      id: "recommendation-2",
      title: "Finish your scholarship outline",
      explanation:
        "It is your shortest path to meaningful AFROTC mission progress this week.",
      actionLabel: "Open mission",
      href: "/school/afrotc",
    },
    {
      id: "recommendation-3",
      title: "Review new Physics feedback",
      explanation:
        "Your quiz result identifies one concept worth revisiting before the mechanics exam.",
      actionLabel: "View grade",
      href: "/school/grades",
    },
  ],
  quickActions: [
    { id: "assignment", href: "/school/assignments", label: "Add assignment", icon: "assignment" },
    { id: "schedule", href: "/school/schedule", label: "Open schedule", icon: "schedule" },
    { id: "courses", href: "/school/courses", label: "View courses", icon: "courses" },
    { id: "study", href: "/school/schedule", label: "Study planner", icon: "study" },
  ],
};

export interface SchoolOverviewProvider {
  getOverview(): Promise<SchoolOverviewData>;
}

class DevelopmentSchoolOverviewProvider implements SchoolOverviewProvider {
  public async getOverview(): Promise<SchoolOverviewData> {
    return {
      ...developmentOverviewData,
      dateLabel: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    };
  }
}

class UnavailableSchoolOverviewProvider implements SchoolOverviewProvider {
  public async getOverview(): Promise<SchoolOverviewData> {
    return {
      studentName: "",
      dateLabel: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
      briefing: {
        summary: "Connect your academic sources to receive a personalized daily briefing.",
        facts: [],
        actionLabel: "Open settings",
        actionHref: "/school/settings",
      },
      classes: [],
      assignments: [],
      deadlines: [],
      semester: {
        name: "No active semester",
        elapsedPercent: 0,
        elapsedLabel: "Semester dates unavailable",
        completedCredits: 0,
        totalCredits: 0,
      },
      academics: {
        currentGpa: "—",
        termGpa: "—",
        creditsEarned: 0,
        creditsRemaining: 0,
      },
      grades: [],
      announcements: [],
      mission: {
        title: "No active mission",
        progressPercent: 0,
        nextMilestone: "Connect AFROTC or mission data to begin tracking.",
        impactLabel: "",
      },
      recommendations: [],
      quickActions: developmentOverviewData.quickActions,
    };
  }
}

export class OverviewService {
  public constructor(private readonly provider: SchoolOverviewProvider) {}

  public getOverview(): Promise<SchoolOverviewData> {
    return this.provider.getOverview();
  }
}

function getSchoolOverviewProvider(): SchoolOverviewProvider {
  return process.env.NODE_ENV === "development"
    ? new DevelopmentSchoolOverviewProvider()
    : new UnavailableSchoolOverviewProvider();
}

export function getSchoolOverview(): Promise<SchoolOverviewData> {
  return new OverviewService(getSchoolOverviewProvider()).getOverview();
}
