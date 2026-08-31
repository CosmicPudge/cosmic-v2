import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getServerSchoolMailProviders } from "@/core/serverCosmic";
import { createSchoolEmailSource, upsertSchoolEmailProposal } from "@/services/school/emailRepository";
import { classifySchoolEmail, extractSchoolEmailProposals, normalizeSchoolEmail, schoolEmailSourceId } from "@/services/school/email";
import { getSchoolSnapshotForAccount } from "@/services/school/server";
import { assertSameOrigin } from "@/services/security/origin";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireSchoolAccess(request); const providers = await getServerSchoolMailProviders(request); if (!providers.length) return NextResponse.json({ error: "No supported email connection is available." }, { status: 409 });
    const snapshot = await getSchoolSnapshotForAccount(account.id); const knownTerms = [...snapshot.courses.map((course) => course.name), ...(snapshot.canvasCourses ?? []).map((course) => course.name)]; let scanned = 0; let relevant = 0; let proposals = 0; const providerResults: Record<string, string> = {};
    for (const item of providers) { try { const messages = await item.engine.getMessages({ limit: 30 }); scanned += messages.length; let providerRelevant = 0; let providerProposals = 0; for (const raw of messages) { const message = normalizeSchoolEmail(raw, item.connectionId, account.id); const classification = classifySchoolEmail(message, knownTerms); if (classification.relevance === "not_relevant") continue; relevant += 1; providerRelevant += 1; const sourceId = schoolEmailSourceId(message); await createSchoolEmailSource({ id: sourceId, userId: account.id, title: message.subject || "School email", sourceType: "email", category: "school-email", sourceDate: message.receivedAt, notes: `${message.provider} · ${message.senderAddress}`, processingStatus: "ready", processingVersion: 1 }); const extracted = extractSchoolEmailProposals(message, classification.relevance); for (const proposal of extracted) { const saved = await upsertSchoolEmailProposal({ id: proposal.id, userId: account.id, sourceId, provider: message.provider, connectionId: message.connectionId, messageId: message.messageId, type: proposal.type, title: proposal.title, description: proposal.description, evidence: proposal.evidence, confidence: proposal.confidence }); if (saved) { proposals += 1; providerProposals += 1; } } } providerResults[item.provider] = `scanned:${messages.length},relevant:${providerRelevant},proposals:${providerProposals}`; } catch { providerResults[item.provider] = "unavailable"; } }
    return NextResponse.json({ scanned, relevant, proposals, providers: providerResults }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "School email scan is temporarily unavailable." }, { status: 503 }); }
}
