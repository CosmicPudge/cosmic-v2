import type { CSSProperties, ReactNode } from "react";

export type CosmicIconState =
  | "idle"
  | "hover"
  | "active"
  | "loading"
  | "success"
  | "warning"
  | "error"
  | "live"
  | "attention"
  | "disabled";

export type CosmicIconName =
  | "dashboard" | "calendar" | "school" | "projects"
  | "notes" | "music" | "finance" | "sports" | "garage" | "clock"
  | "notifications" | "cosmic-ai" | "gmail" | "outlook" | "files" | "weather"
  | "search" | "settings" | "account" | "tasks" | "reminders" | "system"
  | "sync" | "network" | "tools" | "data" | "cosmic-plus"
  | "live" | "on-air" | "online" | "offline" | "syncing" | "loading"
  | "complete" | "warning" | "error" | "information" | "favorite"
  | "locked" | "unlocked" | "download" | "upload"
  | "income" | "expense" | "savings" | "credit-card" | "investment" | "transfer";

export type CosmicWeatherCondition =
  | "clear-day" | "clear-night" | "partly-cloudy" | "cloudy" | "rain"
  | "heavy-rain" | "thunderstorm" | "snow" | "fog" | "wind" | "sunrise" | "sunset";

export type CosmicFinanceTrend = "up" | "down" | "neutral";
export type CosmicIconGlow = "purple" | "blue" | "cyan" | "success" | "warning" | "danger";

export interface CosmicIconProps {
  icon: CosmicIconName;
  size?: number;
  state?: CosmicIconState;
  className?: string;
  label?: string;
  count?: number;
  condition?: CosmicWeatherCondition;
  trend?: CosmicFinanceTrend;
  intensity?: number;
  live?: boolean;
  playing?: boolean;
  glow?: CosmicIconGlow;
  interactive?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  children?: ReactNode;
}
