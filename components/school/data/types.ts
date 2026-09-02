export type SchoolEventType =
  | "class"
  | "assignment"
  | "exam"
  | "quiz"
  | "afrotc"
  | "meeting"
  | "announcement"
  | "discussion"
  | "reading"
  | "module"
  | "office-hours"
  | "course-event"
  | "other-academic"
  | "other";

export type {
  AcademicGoal,
  Assignment,
  AssignmentStatus,
  Course,
  CourseMeeting,
  Grade,
  SchoolResource,
  SchoolTerm,
} from "@/core/contracts/School";

export interface SchoolEvent {
  id: string;
  title: string;

  start: Date;
  end: Date;

  location?: string;
  description?: string;

  course?: string;

  type: SchoolEventType;

  source: "mock" | "canvas-calendar";
  allDay?: boolean;
  courseId?: string;
  sourceMetadata?: {
    uid?: string;
    recurrenceId?: string;
    rrule?: string;
    status?: string;
    sequence?: number;
    lastModified?: string;
    dtstamp?: string;
    url?: string;
  };
}

export interface Mission {
  title: string;
  subtitle: string;
  priority: "low" | "medium" | "high";
}
export interface Focus {
  title: string;
  course?: string;
  priority: "high" | "medium" | "low";
  progress: number;
  estimatedMinutes: number;
  reason: string;
}

export interface DashboardStats {
  classesToday: number;
  assignmentsDueToday: number;
  afrotcEvents: number;
  gpa?: number;
}

export interface SemesterInfo {
  semester: string;
  week: number;
  progress: number;
}

export interface SchoolClass {
  id: string;

  name: string;

  start: Date;

  end: Date;

  location?: string;

  instructor?: string;
}

export interface SchoolAssignment {
  id: string;

  title: string;

  due: Date;

  course?: string;

  completed: boolean;

  priority: "low" | "medium" | "high";
}

export interface SchoolAnnouncement {
  id: string;

  title: string;

  body: string;

  date: Date;
}

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  start: Date;
  end?: Date;
  type: SchoolEventType;
}

export interface SchoolDashboardData {
  mission: Mission;

  focus: Focus;

  headline: string;

status: string;

timeline: TimelineItem[];

  stats: DashboardStats;

  semester: SemesterInfo;

  events: SchoolEvent[];

  classes: SchoolClass[];

  assignments: SchoolAssignment[];

  announcements: SchoolAnnouncement[];
}
