export type SchoolAssignmentSource = "canvas-api" | "canvas-calendar" | "school-source" | "manual";
export type SchoolAssignmentCompletion = "upcoming" | "due_soon" | "overdue" | "completed" | "submitted" | "graded" | "missing" | "unknown";
export type SchoolPlanningStatus = "not_started" | "planned" | "in_progress" | "done";
export type SchoolPlanningPriority = "low" | "normal" | "high" | "critical";

export interface SchoolAssignmentProvenance {
  sourceId?: string;
  sourceType: SchoolAssignmentSource;
  externalId?: string;
  evidence?: string;
  extractor?: "deterministic" | "ai";
}

export interface SchoolPlanningAssignment {
  id: string;
  accountId: string;
  title: string;
  rawTitle?: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  sourceType: SchoolAssignmentSource;
  sourceId?: string;
  externalId?: string;
  dueAt?: Date;
  availableAt?: Date;
  lockAt?: Date;
  completionStatus: SchoolAssignmentCompletion;
  planningStatus: SchoolPlanningStatus;
  priority: SchoolPlanningPriority;
  estimatedMinutes?: number;
  pointsPossible?: number;
  published?: boolean;
  canvasUrl?: string;
  personalNotes?: string;
  provenance?: SchoolAssignmentProvenance[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
  sourceUpdatedAt?: Date;
}

export interface SchoolTimelineEntry {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  kind: "class" | "assignment" | "afrotc" | "event" | "deadline" | "appointment" | "other";
  location?: string;
  courseName?: string;
  status?: string;
  sourceType: string;
  sourceId?: string;
  provenance?: SchoolAssignmentProvenance[];
}

export interface SchoolPlanRecommendation {
  assignmentId: string;
  title: string;
  score: number;
  reason: string;
}
