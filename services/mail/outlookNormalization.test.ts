import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { normalizeOutlookMessage } from "./outlookNormalization.ts";

test("normalizes bounded Outlook HTML mail and stable provider fields", () => {
  const message = normalizeOutlookMessage({ id: "graph-message-1", conversationId: "conversation-1", subject: "LLAB Update", body: { contentType: "html", content: "<style>.tracking{display:none}</style><p>LLAB has moved to 0700.</p><script>alert(1)</script>" }, sender: { emailAddress: { name: "Instructor", address: "instructor@usu.edu" } }, receivedDateTime: "2026-08-30T12:00:00Z", isRead: false, webLink: "https://outlook.office.com/mail/id/graph-message-1", hasAttachments: true, attachments: [{ id: "attachment-1", name: "schedule.pdf", contentType: "application/pdf", size: 42 }] });
  assert.equal(message.provider, "outlook"); assert.equal(message.threadId, "conversation-1"); assert.equal(message.bodyText, "LLAB has moved to 0700."); assert.equal(message.unread, true); assert.equal(message.webUrl?.startsWith("https://"), true); assert.deepEqual(message.attachments, [{ name: "schedule.pdf", contentType: "application/pdf", size: 42, providerId: "attachment-1" }]); assert.equal(message.bodyText.includes("alert"), false);
});
test("does not invent identity for malformed Graph mail", () => { const message = normalizeOutlookMessage({ bodyPreview: "Preview" }); assert.equal(message.id, ""); assert.equal(message.subject, "(No subject)"); assert.equal(message.bodyText, "Preview"); });
