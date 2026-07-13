export interface TimelineEvent {
  id: string;

  title: string;

  type:
    | "calendar"
    | "weather"
    | "sports"
    | "garage"
    | "system";

  start: Date;

  end?: Date;

  priority: number;
}