export type DayActionType =
  | "leave"
  | "calendar"
  | "weather"
  | "sports"
  | "garage"
  | "assistant"
  | "system";

export interface DayAction {
  id: string;

  type: DayActionType;

  title: string;

  subtitle?: string;

  priority: number;

  scheduledTime?: Date;

  destination?: string;
}

export interface DaySnapshot {
  greeting: string;

  summary: string;

  nextAction?: DayAction;

  actions: DayAction[];

  generatedAt: Date;
}