import { randomUUID } from "crypto";
import { getGoogleAuthorizationUrl } from "@/services/mail/gmail";

export const dynamic = "force-dynamic";
const states = new Map<string, number>();
export async function GET() {
  const state = randomUUID();
  states.set(state, Date.now() + 10 * 60 * 1000);
  try { return Response.redirect(getGoogleAuthorizationUrl(state), 302); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Gmail OAuth is unavailable." }, { status: 503 }); }
}
export function consumeGoogleState(state: string | null): boolean { if (!state || !states.has(state) || states.get(state)! < Date.now()) return false; states.delete(state); return true; }
