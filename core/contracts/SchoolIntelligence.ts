export type SchoolSourceType = "upload-pdf" | "upload-text" | "upload-image" | "upload-docx" | "voice-recording" | "apple_voice_memos_transcript" | "manual_transcript" | "other_transcript" | "email" | "calendar" | "manual";
export const SCHOOL_SOURCE_TYPES: readonly SchoolSourceType[] = ["upload-pdf", "upload-text", "upload-image", "upload-docx", "voice-recording", "apple_voice_memos_transcript", "manual_transcript", "other_transcript", "email", "calendar", "manual"];
export type SchoolSourceStatus = "pending" | "processing" | "ready" | "ready_degraded" | "needs_review" | "failed" | "unsupported";
export type SchoolFactKind = "course" | "assignment" | "grade" | "schedule" | "event-type" | "deadline" | "location" | "time" | "timezone" | "attire" | "uniform" | "required-item" | "audience" | "contact" | "other";
export type SchoolFactCertainty = "explicit" | "inferred" | "unknown" | "conflicting";

export interface SchoolSource {
  id: string;
  accountId: string;
  type: SchoolSourceType;
  title: string;
  originalName?: string;
  provider?: string;
  importedAt: string;
  sourceDate?: string;
  status: SchoolSourceStatus;
  version: number;
  contentHash?: string;
  lastProcessedAt?: string;
}

export interface SchoolProvenance {
  sourceId: string;
  proposalId?: string;
  sourceVersion: number;
  locator?: { pageNumber?: number; section?: string; startOffset?: number; endOffset?: number };
  excerpt?: string;
  extractor?: "deterministic" | "ai";
  extractorVersion?: number;
}

export interface SchoolFact {
  id: string;
  accountId: string;
  kind: SchoolFactKind;
  subject: string;
  value: string;
  certainty: SchoolFactCertainty;
  provenance: SchoolProvenance[];
  extractedAt: string;
  requiresValidation?: boolean;
}

export interface SchoolEvent {
  id: string;
  accountId: string;
  title: string;
  category?: "academic" | "afrotc" | "other";
  eventType?: "class" | "pt" | "llab" | "meeting" | "briefing" | "training" | "appointment" | "exam" | "assignment" | "deadline" | "orientation" | "other";
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  recurrence?: string;
  location?: { name: string; building?: string; room?: string; address?: string; onlineUrl?: string };
  attire?: { value: string; certainty: SchoolFactCertainty };
  requiredItems?: string[];
  audience?: string;
  action?: string;
  status?: "canceled";
  factIds: string[];
  provenance: SchoolProvenance[];
  certainty: SchoolFactCertainty;
}

export interface SchoolActionItem {
  id: string;
  accountId: string;
  title: string;
  dueAt?: string;
  dueText?: string;
  status: "open" | "completed" | "needs_review";
  factIds: string[];
  provenance: SchoolProvenance[];
}

export interface SchoolConflict {
  id: string;
  accountId: string;
  factIds: string[];
  description: string;
  status: "open" | "resolved";
  createdAt: string;
  resolvedAt?: string;
}

export interface SchoolSourceIntelligence {
  facts: SchoolFact[];
  events: SchoolEvent[];
  actionItems: SchoolActionItem[];
  conflicts: SchoolConflict[];
  warnings: string[];
}
