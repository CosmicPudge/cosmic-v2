import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { updateSchoolEmailProposal } from "@/services/school/emailRepository";
import { applySchoolEmailProposal } from "@/services/school/emailApply";
import { assertSameOrigin } from "@/services/security/origin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { assertSameOrigin(request); const account = await requireSchoolAccess(request); const body = await request.json() as { status?: unknown }; const id = (await context.params).id; if (body.status === "approved") { const result = await applySchoolEmailProposal(account.id, id); return result ? NextResponse.json({ proposal: result }) : NextResponse.json({ error: "Proposal not found." }, { status: 404 }); } if (body.status !== "dismissed") return NextResponse.json({ error: "Invalid proposal status." }, { status: 400 }); const proposal = await updateSchoolEmailProposal(account.id, id, body.status); return proposal ? NextResponse.json({ proposal }) : NextResponse.json({ error: "Proposal not found." }, { status: 404 }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "School update could not be changed." }, { status: 503 }); } }
