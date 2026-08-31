import type { MailMessage } from "@/core/contracts/Mail";

export const MAX_MANUAL_EMAIL_BODY = 50_000;

function header(body: string, name: string) { return new RegExp(`^${name}:\\s*(.+)$`, "im").exec(body)?.[1]?.trim(); }
function stripPastedMarkup(value: string) { return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(); }

export interface ManualEmailInput { importId: string; sender: string; subject: string; receivedAt: string; body: string; to?: string; cc?: string; }

export function normalizeManualEmail(input: ManualEmailInput, accountId: string): MailMessage {
  if (input.body.length > MAX_MANUAL_EMAIL_BODY) throw new Error("Email body is too large.");
  const body = stripPastedMarkup(input.body); const sender = input.sender.trim() || header(body, "From") || "unknown"; const subject = input.subject.trim() || header(body, "Subject") || "(No subject)"; const received = input.receivedAt.trim() || header(body, "Sent") || header(body, "Received"); const receivedAt = new Date(received ?? "");
  if (!input.importId || !/^[A-Za-z0-9_-]{8,100}$/.test(input.importId)) throw new Error("Invalid import identity.");
  if (!received || Number.isNaN(receivedAt.getTime())) throw new Error("A valid received date is required.");
  return { id: `manual:${accountId}:${input.importId}`, provider: "manual", accountId, from: { email: sender }, to: input.to?.trim() ? [{ email: input.to.trim() }] : [], ...(input.cc?.trim() ? { cc: [{ email: input.cc.trim() }] } : {}), subject: subject.slice(0, 500), bodyText: body.slice(0, MAX_MANUAL_EMAIL_BODY), receivedAt, unread: false, hasAttachments: false };
}
