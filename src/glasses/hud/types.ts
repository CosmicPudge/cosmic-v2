export type HudPriority =
  | "passive"
  | "glance"
  | "attention"
  | "critical";

export type HudView = {
  id: string;
  title: string;
  body: string;
  priority: HudPriority;
  timeoutMs?: number;
};