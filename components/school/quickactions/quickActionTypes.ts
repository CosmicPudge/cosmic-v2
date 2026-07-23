import { LucideIcon } from "lucide-react";

export type QuickActionCategory =
  | "school"
  | "communication"
  | "productivity"
  | "assistant"
  | "utility"
  | "media"
  | "system";

export type QuickActionVariant =
  | "primary"
  | "secondary"
  | "accent";

export interface QuickActionBadge {
  value: string;
  color?: string;
}

export interface QuickAction {
  id: string;

  title: string;

  subtitle?: string;

  icon: LucideIcon;

  href: string;

  category: QuickActionCategory;

  variant: QuickActionVariant;

  color: string;

  disabled?: boolean;

  notification?: boolean;

  badge?: QuickActionBadge;
}

export interface QuickActionsSummary {
  total: number;

  enabled: number;

  notifications: number;
}

export interface QuickActionsData {
  actions: QuickAction[];
}

export interface QuickActionsState {
  actions: QuickAction[];

  summary: QuickActionsSummary;
}