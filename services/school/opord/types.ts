export type OpordFieldStatus = "explicit" | "unknown" | "conflicting";

export type OpordField<T> =
  | { status: "explicit"; value: T; excerpt?: string }
  | { status: "unknown"; value: null; excerpt?: string }
  | { status: "conflicting"; values: T[]; excerpt?: string };

export interface OpordDeadline {
  action: string;
  qualifier: "NLT" | "NET" | "unspecified";
  time: string | null;
  raw: string;
}

export type PfraRelevance = "direct-pfra" | "supporting" | "other";

export interface PtExercise {
  name: string;
  reps?: number;
  sets?: number;
  durationMinutes?: number;
  distance?: string;
  pace?: string;
  notes?: string;
  relevance: PfraRelevance;
  sourcePage?: number;
  source: string;
}

export interface PtWorkoutBlock {
  category: string;
  exercises: PtExercise[];
  running: PtExercise[];
}

export interface PtWorkout {
  title: string;
  audience?: string;
  totalRepetitions?: number;
  blocks: PtWorkoutBlock[];
  notes: string[];
  source: string;
  sourcePage?: number;
}

export interface OpordEvent {
  id: string;
  type?: "llab" | "pt";
  title: string;
  date: OpordField<string>;
  reportTime: OpordField<string>;
  reportQualifier: OpordField<"NLT" | "NET" | "Pre-Formation" | "unspecified">;
  startTime: OpordField<string>;
  endTime: OpordField<string>;
  location: OpordField<string>;
  formUpLocation: OpordField<string>;
  activityLocations: string[];
  uniform: OpordField<string>;
  uniformRequirements: { audience: string; uniform: string; excerpt?: string }[];
  bring: string[];
  timeline: string[];
  workouts: PtWorkout[];
  specialConditions: string[];
  instructions: string[];
  deadlines: OpordDeadline[];
  status: "scheduled" | "cancelled" | "unknown";
  sourceId: string;
  sourceName: string;
  provenance: { sourceName: string; excerpt: string };
  diagnostics?: {
    sourcePage?: number;
    recognizedLabels: string[];
    unresolvedLabels: string[];
    attachmentLinks: string[];
  };
}

export interface OpordDocument {
  documentKind: "afrotc_opord";
  sourceId: string;
  sourceName: string;
  opordNumber: OpordField<string>;
  title: OpordField<string>;
  organization: OpordField<string>;
  effectiveDate: OpordField<string>;
  publicationDate: OpordField<string>;
  eventDateRange: OpordField<string>;
  purpose: OpordField<string>;
  events: OpordEvent[];
  parsedAt: string;
  parserVersion?: string;
  weekNumber?: number;
  weekLabel?: string;
  isSuperseded?: boolean;
  revisionOfSourceId?: string;
}
