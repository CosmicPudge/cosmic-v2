export type DeadlinePriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type DeadlineStatus =
  | "overdue"
  | "due-today"
  | "upcoming"
  | "scheduled"
  | "completed";

export type DeadlineType =
  | "assignment"
  | "quiz"
  | "exam"
  | "lab"
  | "project"
  | "discussion"
  | "reading"
  | "presentation"
  | "meeting"
  | "other";

export interface DeadlineCourse {
  id: string;
  code: string;
  name: string;
  color?: string;
}

export interface DeadlineAction {
  label: string;
  href?: string;
}

export interface Deadline {
  id: string;

  title: string;

  description?: string;

  type: DeadlineType;

  course: DeadlineCourse;

  dueDate: Date;

  status: DeadlineStatus;

  priority: DeadlinePriority;

  /**
   * Estimated time to complete (minutes)
   */
  estimatedMinutes?: number;

  /**
   * Weight toward final grade (0–100)
   */
  gradeWeight?: number;

  /**
   * Current completion percentage
   */
  completion?: number;

  /**
   * AI-generated recommendation
   */
  aiInsight?: string;

  /**
   * Optional quick action
   */
  action?: DeadlineAction;
}

export interface DeadlineSummary {
  overdue: number;

  dueToday: number;

  dueTomorrow: number;

  upcoming: number;

  completed: number;

  totalEstimatedMinutes: number;

  aiSummary?: string;
}

export interface DeadlinesData {
  summary: DeadlineSummary;

  deadlines: Deadline[];
}

export interface DeadlinesState {
  summary: DeadlineSummary;

  deadlines: Deadline[];

  urgentDeadline?: Deadline;

  overdueDeadlines: Deadline[];

  dueToday: Deadline[];

  dueTomorrow: Deadline[];

  upcoming: Deadline[];

  completed: Deadline[];

  completionPercentage: number;

  totalRemainingMinutes: number;
}