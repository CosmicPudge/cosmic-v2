export type TimelineEventType =
  | "class"
  | "assignment"
  | "exam"
  | "quiz"
  | "study"
  | "meeting"
  | "afrotc"
  | "deadline"
  | "personal"
  | "travel";

export type TimelinePriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type TimelineStatus =
  | "upcoming"
  | "current"
  | "completed"
  | "missed"
  | "cancelled";

export interface TimelineAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface TimelineLocation {
  name: string;
  building?: string;
  room?: string;
}

export interface TimelineEvent {
  id: string;

  title: string;
  description?: string;

  type: TimelineEventType;
  priority: TimelinePriority;

  /**
   * Optional.
   * If omitted, the timeline engine will determine the status
   * automatically using the current time.
   */
  status?: TimelineStatus;

  /**
   * 24-hour format
   * Example: "08:30"
   */
  startTime: string;

  /**
   * 24-hour format
   * Example: "10:15"
   */
  endTime?: string;

  /**
   * Display labels used by the UI.
   */
  dateLabel: string;
  timeLabel: string;

  location?: TimelineLocation;

  durationMinutes?: number;

  action?: TimelineAction;

  aiGenerated?: boolean;
}

/**
 * Raw timeline data provided by the application.
 */
export interface TimelineData {
  /**
   * Current time in 24-hour format.
   * Example: "14:15"
   */
  currentTime: string;

  events: TimelineEvent[];
}

/**
 * Computed timeline returned by the timeline engine.
 * Components should consume this instead of recalculating
 * values themselves.
 */
export interface TimelineState {
  /**
   * Events sorted from earliest to latest.
   */
  events: TimelineEvent[];

  /**
   * Currently active event.
   */
  currentEvent?: TimelineEvent;

  /**
   * Next upcoming event.
   */
  nextEvent?: TimelineEvent;

  /**
   * Number of completed events.
   */
  completedCount: number;

  /**
   * Number of remaining events
   * (current + upcoming).
   */
  remainingCount: number;

  /**
   * Total scheduled minutes.
   */
  scheduledMinutes: number;

  /**
   * Total completed minutes.
   */
  completedMinutes: number;

  /**
   * Percentage of the day's schedule completed.
   */
  progress: number;
}