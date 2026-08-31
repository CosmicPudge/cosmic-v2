import type { MailMessage } from "../../core/contracts/Mail";

export interface OutlookGraphMessage {
  id?: string;
  conversationId?: string;
  subject?: string;
  bodyPreview?: string;
  body?: { contentType?: string; content?: string };
  sender?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
  ccRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
  receivedDateTime?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  webLink?: string;
  attachments?: Array<{ id?: string; name?: string; contentType?: string; size?: number; isInline?: boolean }>;
}

function textFromHtml(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}

function address(value?: { name?: string; address?: string }) { return value?.address ? { ...(value.name ? { name: value.name } : {}), email: value.address } : null; }

export function normalizeOutlookMessage(message: OutlookGraphMessage): MailMessage {
  const html = message.body?.contentType?.toLowerCase() === "html" ? message.body.content ?? "" : undefined;
  const from = address(message.sender?.emailAddress) ?? { email: "unknown" };
  const receivedAt = new Date(message.receivedDateTime ?? 0);
  return {
    id: message.id ?? "",
    provider: "outlook",
    ...(message.conversationId ? { threadId: message.conversationId } : {}),
    from,
    to: (message.toRecipients ?? []).flatMap((item) => { const value = address(item.emailAddress); return value ? [value] : []; }),
    cc: (message.ccRecipients ?? []).flatMap((item) => { const value = address(item.emailAddress); return value ? [value] : []; }),
    subject: message.subject?.trim() || "(No subject)",
    bodyText: html ? textFromHtml(html) : (message.body?.content ?? message.bodyPreview ?? "").replace(/\s+/g, " ").trim(),
    ...(html ? { bodyHtml: undefined } : {}),
    receivedAt: Number.isNaN(receivedAt.getTime()) ? new Date(0) : receivedAt,
    unread: message.isRead === false,
    ...(message.webLink ? { webUrl: message.webLink } : {}),
    ...(message.attachments?.length ? { attachments: message.attachments.filter((item) => !item.isInline && item.name).map((item) => ({ name: item.name!, ...(item.contentType ? { contentType: item.contentType } : {}), ...(typeof item.size === "number" ? { size: item.size } : {}), ...(item.id ? { providerId: item.id } : {}) })) } : {}),
    ...(message.hasAttachments !== undefined ? { hasAttachments: message.hasAttachments } : {}),
  };
}
