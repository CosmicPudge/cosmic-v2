import type { SchoolNotification } from "../notifications/notificationTypes";
import type { FocusData } from "../focus/focusTypes";
import type { TimelineData } from "../timeline/timelineTypes";
import type { AcademicsData } from "../academics/academicTypes";
import type { DeadlinesData } from "../deadlines/deadlineTypes";
import type { CoachData } from "../aicoach/coachTypes";
import type { AFROTCData } from "../afrotc/afrotcTypes";
import type { QuickActionsData } from "../quickactions/quickActionTypes";
import type { PriorityData } from "../priority/priorityTypes";

export type GreetingPeriod =
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

export interface DashboardGreeting {
  period: GreetingPeriod;
  title: string;
  subtitle: string;
}

export interface DashboardOverview {
  location: string;
  temperature: number;
  condition: string;

  nextClass?: string;
  nextClassTime?: string;

  todaysClasses: number;
}

export interface SchoolDashboardData {
  greeting: DashboardGreeting;

  overview: DashboardOverview;

  notifications: SchoolNotification[];

  focus: FocusData;

  timeline: TimelineData;

  academics: AcademicsData;

  deadlines: DeadlinesData;

  coach: CoachData;

  afrotc: AFROTCData;

  quickActions: QuickActionsData;

  priority: PriorityData;
}

export interface SchoolDashboardState {
  greeting: DashboardGreeting;

  overview: DashboardOverview;

  notifications: SchoolNotification[];

  focus: FocusData;

  timeline: TimelineData;

  academics: AcademicsData;

  deadlines: DeadlinesData;

  coach: CoachData;

  afrotc: AFROTCData;

  quickActions: QuickActionsData;

  priority: PriorityData;
}