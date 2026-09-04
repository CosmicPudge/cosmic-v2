import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { listSchoolResources, listStudyCards, listStudySets } from "@/services/school/studyRepository";
export async function GET(request: Request) { const account = await requireSchoolAccess(request); const [sets, cards, resources] = await Promise.all([listStudySets(account.id), listStudyCards(account.id), listSchoolResources(account.id)]); const now = new Date(); const due = cards.filter((card) => !card.lastReviewedAt || Boolean(card.nextReviewAt && card.nextReviewAt <= now)); return NextResponse.json({ sets, cards, resources, dueCount: due.length }, { headers: { "Cache-Control": "no-store" } }); }
