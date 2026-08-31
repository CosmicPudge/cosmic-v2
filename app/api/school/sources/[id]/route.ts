import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { deleteSchoolSourceRecord, getSchoolSource } from "@/services/school/sources/repository";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request);
  const row = await getSchoolSource(account.id, (await context.params).id);
  if (!row) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  return NextResponse.json({ source: row }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request);
  const deleted = await deleteSchoolSourceRecord(account.id, (await context.params).id);
  return deleted ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: "Source not found." }, { status: 404 });
}
