import type { MailProvider } from "./Mail";

export type SchoolEmailRelevance = "relevant" | "uncertain" | "not_relevant";
export type SchoolEmailTrust = "trusted" | "known" | "unknown";
export type SchoolEmailChangeType = "assignment_created" | "assignment_due_date_changed" | "event_created" | "event_time_changed" | "event_location_changed" | "event_canceled" | "class_canceled" | "class_rescheduled" | "uniform_changed" | "required_items_changed" | "other_explicit_school_update";
export type SchoolEmailProposalStatus = "pending" | "approved" | "applied" | "dismissed" | "failed" | "needs_target";

export interface SchoolEmailMessage {
  accountId: string;
  provider: MailProvider;
  connectionId: string;
  messageId: string;
  threadId?: string;
  subject: string;
  senderName?: string;
  senderAddress: string;
  receivedAt: Date;
  plainTextBody: string;
  snippet: string;
  messageUrl?: string;
  hasAttachments: boolean;
}

export interface SchoolEmailProposal {
  id: string;
  accountId: string;
  sourceId: string;
  type: SchoolEmailChangeType;
  title: string;
  description: string;
  evidence: string;
  confidence: number;
  status: SchoolEmailProposalStatus;
  appliedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
