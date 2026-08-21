import { ReactNode } from "react";

export type WidgetAccent =
  | "default"
  | "weather"
  | "calendar"
  | "sports"
  | "garage"
  | "school"
  | "cosmic"
  | "projects"
  | "notifications"
  | "notes"
  | "outlook"
  | "system"
  | "music"
  | "search"
  | "briefing"
  | "clock"
  | "finance";

export type WidgetSize = "small" | "medium" | "large";

export interface WidgetBaseProps {
  children?: ReactNode;
  className?: string;
}

export interface WidgetSectionProps extends WidgetBaseProps {
  title?: string;
}

export interface WidgetMetricProps {
  value: ReactNode;
  label?: ReactNode;
  align?: "left" | "center" | "right";
}

export interface WidgetBadgeProps {
  children: ReactNode;
}

export interface WidgetButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}
