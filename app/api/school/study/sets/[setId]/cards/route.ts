import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { createStudyCard, getStudySet, listStudyCards } from "@/services/school/studyRepository";
import { parseBulkCards } from "@/services/school/studyBulk";
import { assertSameOrigin } from "@/services/security/origin";

type Context = { params: Promise<{ setId: string }> };

export async function GET(request: Request, context: Context) {
  const account = await requireSchoolAccess(request);
  const cards = await listStudyCards(account.id, (await context.params).setId);
  return NextResponse.json({ cards });
}

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const account = await requireSchoolAccess(request);
    const setId = (await context.params).setId;
    if (!await getStudySet(account.id, setId)) return NextResponse.json({ error: "Study set not found." }, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    const inputCards = Array.isArray(body.cards) ? body.cards : typeof body.bulk === "string" ? parseBulkCards(body.bulk).cards : [];
    const valid = inputCards.every((item) => {
      if (!item || typeof item !== "object") return false;
      const value = item as Record<string, unknown>;
      return typeof value.front === "string" && Boolean(value.front.trim()) && typeof value.back === "string" && Boolean(value.back.trim());
    });
    if (!inputCards.length || !valid) return NextResponse.json({ error: "Every card needs a front and back." }, { status: 400 });
    const cards = await Promise.all(inputCards.slice(0, 200).map((item) => {
      const value = item as Record<string, unknown>;
      return createStudyCard({ id: crypto.randomUUID(), setId, accountId: account.id, front: (value.front as string).trim().slice(0, 10_000), back: (value.back as string).trim().slice(0, 10_000), ...(typeof value.notes === "string" && value.notes.trim() ? { notes: value.notes.trim().slice(0, 5_000) } : {}) });
    }));
    return NextResponse.json({ cards }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Cards could not be saved." }, { status: 503 });
  }
}
