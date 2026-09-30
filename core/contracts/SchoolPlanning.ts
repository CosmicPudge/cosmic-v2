export type SchoolAssignmentSource = "canvas-api" | "canvas-calendar" | "school-source" | "manual";
export type SchoolAssignmentCompletion = "upcoming" | "due_soon" | "overdue" | "completed" | "submitted" | "graded" | "missing" | "unknown";
export type SchoolPlanningStatus = "not_started" | "planned" | "in_progress" | "done";
export type SchoolPlanningPriority = "low" | "normal" | "high" | "critical";

export type SchoolAssignmentRequirementKind = "task" | "format" | "length" | "submission" | "grading" | "material" | "other";
export type SchoolAssignmentEffortCategory = "quick" | "moderate" | "heavy" | "major";
export type SchoolAssignmentIntelligenceSource = "manual" | "deterministic" | "ai";
export type SchoolAssignmentDiagnosticSeverity = "low" | "medium" | "high";

export interface SchoolAssignmentRequirement {
  id: string;
  text: string;
  kind: SchoolAssignmentRequirementKind;
  completed?: boolean;
  evidence?: string;
}

export interface SchoolAssignmentDeliverable {
  id: string;
  text: string;
  format?: string;
  evidence?: string;
}

export interface SchoolAssignmentStep {
  id: string;
  text: string;
  order: number;
  estimatedMinutes?: number;
}

export interface SchoolAssignmentAmbiguity {
  id: string;
  text: string;
  severity: SchoolAssignmentDiagnosticSeverity;
  category?: string;
}

export interface SchoolAssignmentWarning {
  id: string;
  text: string;
  severity: SchoolAssignmentDiagnosticSeverity;
  category?: string;
}

/** Derived interpretation kept separate from authoritative provider assignment facts. */
export interface SchoolAssignmentIntelligence {
  summary?: string;
  requirements: SchoolAssignmentRequirement[];
  deliverables: SchoolAssignmentDeliverable[];
  estimatedMinutes?: number | null;
  effortCategory?: SchoolAssignmentEffortCategory;
  suggestedSteps: SchoolAssignmentStep[];
  studyTopics: string[];
  ambiguities: SchoolAssignmentAmbiguity[];
  warnings: SchoolAssignmentWarning[];
  confidence?: number | null;
  generatedAt?: string;
  source?: SchoolAssignmentIntelligenceSource;
}

export interface SchoolCanvasAssignmentMetadata {
  assignmentId: string;
  courseId: string;
  descriptionHtml?: string;
  gradingType?: string;
  submissionTypes?: string[];
  assignmentGroupId?: string;
  quizId?: string;
  discussionTopicId?: string;
  discussionTopicUrl?: string;
  allowedAttempts?: number;
  workflowState?: string;
  submission?: {
    workflowState?: string;
    submittedAt?: string;
    late?: boolean;
    missing?: boolean;
    score?: number;
  };
}

export interface SchoolAssignmentProviderMetadata {
  canvas?: SchoolCanvasAssignmentMetadata;
}

export interface SchoolAssignmentProvenance {
  sourceId?: string;
  sourceType: SchoolAssignmentSource;
  externalId?: string;
  evidence?: string;
  extractor?: "deterministic" | "ai";
  providerMetadata?: SchoolAssignmentProviderMetadata;
}

export interface SchoolPlanningAssignment {
  id: string;
  accountId: string;
  title: string;
  rawTitle?: string;
  description?: string;
  intelligence?: SchoolAssignmentIntelligence;
  /** Provider-preserved metadata carried through the existing provenance JSON. */
  providerMetadata?: SchoolAssignmentProviderMetadata;
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
