import type { LucideIcon } from "lucide-react";

export type PriorityLevel =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "complete";

export type PriorityStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "overdue";

export type PrioritySource =
  | "academics"
  | "deadlines"
  | "calendar"
  | "afrotc"
  | "notifications"
  | "weather"
  | "focus"
  | "assistant";

export interface PriorityRecommendation {
  title: string;
  description: string;
}

export interface PriorityItem {
  id: string;

  title: string;

  subtitle?: string;

  source: PrioritySource;

  level: PriorityLevel;

  status: PriorityStatus;

  score: number;

  dueAt?: Date;

  icon: LucideIcon;

  color: string;

  completed?: boolean;
}

export interface PrioritySummary {
  total: number;

  critical: number;

  high: number;

  medium: number;

  low: number;

  completed: number;
}

export interface PriorityData {
  priorities: PriorityItem[];

  recommendation?: PriorityRecommendation;
}

export interface PriorityState {
  priorities: PriorityItem[];

  summary: PrioritySummary;

  recommendation?: PriorityRecommendation;
}