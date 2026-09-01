import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolSource } from "@/services/school/sources/repository";
import { listSchoolFindings, upsertSchoolFindings } from "@/services/school/findingRepository";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request); const id = (await context.params).id;
  if (!await getSchoolSource(account.id, id)) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  return NextResponse.json({ findings: await listSchoolFindings(account.id, id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request); const id = (await context.params).id; const source = await getSchoolSource(account.id, id);
  if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  const intelligence = source.intelligence as Parameters<typeof upsertSchoolFindings>[2] | null;
  if (!intelligence) return NextResponse.json({ error: "This source has no extracted findings." }, { status: 409 });
  await upsertSchoolFindings(account.id, id, intelligence);
  return NextResponse.json({ findings: await listSchoolFindings(account.id, id) });
}
