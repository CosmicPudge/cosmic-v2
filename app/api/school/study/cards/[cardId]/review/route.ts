import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getStudyCard, updateStudyCard } from "@/services/school/studyRepository";
import { calculateReview, type ReviewRating } from "@/services/school/studyReview";
import { assertSameOrigin } from "@/services/security/origin";
type Context = { params: Promise<{ cardId: string }> };
export async function POST(request: Request, context: Context) { try { assertSameOrigin(request); const account = await requireSchoolAccess(request); const id = (await context.params).cardId; const card = await getStudyCard(account.id, id); if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 }); const body = await request.json() as { rating?: ReviewRating }; if (!body.rating || !["again", "hard", "good", "easy"].includes(body.rating)) return NextResponse.json({ error: "Invalid review rating." }, { status: 400 }); const review = calculateReview(card, body.rating, new Date()); const updated = await updateStudyCard(account.id, id, review); return NextResponse.json({ card: updated }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Review could not be saved." }, { status: 503 }); } }
