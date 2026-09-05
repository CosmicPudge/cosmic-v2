import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolSource } from "@/services/school/sources/repository";

export async function GET(request: Request, context: { params: Promise<{ sourceId: string }> }) {
  const account = await requireSchoolAccess(request); const source = await getSchoolSource(account.id, (await context.params).sourceId);
  if (!source || source.category !== "afrotc-opord") return NextResponse.json({ error: "OPORD not found." }, { status: 404 });
  return NextResponse.json({ source: { id: source.id, title: source.title, originalFileName: source.originalFileName, processingStatus: source.processingStatus, processingError: source.processingError, createdAt: source.createdAt, document: source.intelligence } }, { headers: { "Cache-Control": "no-store" } });
}
