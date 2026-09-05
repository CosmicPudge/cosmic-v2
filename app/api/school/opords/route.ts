import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { listSchoolSources } from "@/services/school/sources/repository";

const CATEGORY = "afrotc-opord";
function isOpord(row: Awaited<ReturnType<typeof listSchoolSources>>[number]) { return row.category === CATEGORY && row.intelligence && typeof row.intelligence === "object" && (row.intelligence as { documentKind?: string }).documentKind === "afrotc_opord"; }
function safeSource(row: Awaited<ReturnType<typeof listSchoolSources>>[number]) { return { id: row.id, title: row.title, sourceType: row.sourceType, originalFileName: row.originalFileName, mimeType: row.mimeType, fileSize: row.fileSize, processingStatus: row.processingStatus, processingError: row.processingError, createdAt: row.createdAt, updatedAt: row.updatedAt, document: row.intelligence }; }

export async function GET(request: Request) {
  const account = await requireSchoolAccess(request);
  const sources = (await listSchoolSources(account.id)).filter(isOpord).map(safeSource);
  return NextResponse.json({ sources }, { headers: { "Cache-Control": "no-store" } });
}
