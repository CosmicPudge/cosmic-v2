export type MailProvider = "gmail" | "outlook" | "manual";

export interface MailAddress {
  name?: string;
  email: string;
}

export interface MailMessage {
  id: string;
  provider: MailProvider;
  accountId?: string;
  threadId?: string;

  messageIdHeader?: string;

  references?: string[];
  from: MailAddress;
  to: MailAddress[];
  cc?: MailAddress[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  webUrl?: string;
  attachments?: Array<{ name: string; contentType?: string; size?: number; providerId?: string }>;
  receivedAt: Date;
  unread: boolean;
  hasAttachments?: boolean;
}

export interface MailSnapshot {
  messages: MailMessage[];
  unreadCount: number;
  lastUpdated: Date;
}

export interface SendMailResult {
  id: string;
  threadId?: string;
  provider: MailProvider;
  sentAt: Date;
}

export type MailIntent = "scheduling" | "question" | "information" | "task" | "confirmation" | "unknown";

export interface MailAnalysis {
  messageId: string;
  intent: MailIntent;
  summary: string;
  requiresResponse: boolean;
  schedulingRequest?: {
    requestedStart?: Date;
    requestedEnd?: Date;
    requestedTimeText?: string;
    resolved?: boolean;
  };
  confidence?: number;
}
