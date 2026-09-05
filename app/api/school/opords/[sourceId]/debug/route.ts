import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolSource } from "@/services/school/sources/repository";
import { normalizeOpordDocument } from "@/services/school/opord/selectors";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sourceId: string }> }) {
  const account = await requireSchoolAccess(request);
  const source = await getSchoolSource(account.id, (await context.params).sourceId);
  if (!source || source.category !== "afrotc-opord") return NextResponse.json({ error: "OPORD not found." }, { status: 404 });
  const document = normalizeOpordDocument(source.intelligence as never);
  return NextResponse.json({ sourceId: source.id, sourceName: source.title, parserVersion: document.parserVersion ?? null, eventCount: document.events.length, sourcePages: document.events.map((event) => event.diagnostics?.sourcePage ?? null), extractedText: source.extractedText ?? "", events: document.events.map((event) => ({ id: event.id, type: event.type ?? null, title: event.title, status: event.status, date: event.date, reportTime: event.reportTime, startTime: event.startTime, endTime: event.endTime, formUpLocation: event.formUpLocation, diagnostics: event.diagnostics ?? null })) }, { headers: { "Cache-Control": "no-store" } });
}
