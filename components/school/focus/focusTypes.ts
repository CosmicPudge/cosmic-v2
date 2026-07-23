export type FocusPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FocusStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "blocked";

export type FocusCategory =
  | "assignment"
  | "exam"
  | "quiz"
  | "project"
  | "study"
  | "reading"
  | "meeting"
  | "afrotc"
  | "personal";

export interface FocusAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface FocusTask {
  id: string;

  title: string;
  description?: string;

  category: FocusCategory;
  priority: FocusPriority;
  status: FocusStatus;

  dueText?: string;
  estimatedMinutes?: number;
  progress?: number;

  action?: FocusAction;
}

export interface FocusMission {
  title: string;

  subtitle: string;

  description?: string;

  priority: FocusPriority;

  progress: number;

  estimatedMinutes: number;

  dueText: string;

  action?: FocusAction;
}

export interface DailyProgress {
  completedTasks: number;

  totalTasks: number;

  completedMinutes: number;

  targetMinutes: number;

  completionPercent: number;
}

export interface FocusData {
  mission: FocusMission;

  tasks: FocusTask[];

  progress: DailyProgress;
}