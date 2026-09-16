import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/services/security/origin";
import { personalCalendarAccessContext } from "@/services/calendar/access";
import { deletePersonalCalendarConnection, getPersonalCalendarConnection, savePersonalCalendarConnection } from "@/services/calendar/personalStore";
import { invalidatePersonalCalendarContext } from "@/services/calendar/personalProvider";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";

function personal(request: Request) {
  const access = personalCalendarAccessContext(request);
  if (!access) throw new Response("Personal Calendar access unavailable.", { status: 401 });
  return access;
}

export async function GET(request: Request) {
  try {
    personal(request);
    const connection = await getPersonalCalendarConnection();
    return NextResponse.json({ configured: isCredentialEncryptionConfigured(), connected: Boolean(connection), provider: connection ? "CalDAV" : null, status: connection ? "configured" : "not-connected", verified: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Personal Calendar status is unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    personal(request);
    assertSameOrigin(request);
    if (!isCredentialEncryptionConfigured()) return NextResponse.json({ error: "Personal Calendar storage is unavailable." }, { status: 503 });
    const body = await request.json() as Record<string, unknown>;
    const serverUrl = typeof body.serverUrl === "string" ? body.serverUrl.trim().replace(/\/$/, "") : "";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^https:\/\//i.test(serverUrl) || !username || !password) return NextResponse.json({ error: "HTTPS server URL, username, and app password are required." }, { status: 400 });
    const defaultCalendarName = typeof body.defaultCalendarName === "string" && body.defaultCalendarName.trim() ? body.defaultCalendarName.trim() : undefined;
    await savePersonalCalendarConnection({ serverUrl, username, password, ...(defaultCalendarName ? { defaultCalendarName } : {}) });
    invalidatePersonalCalendarContext();
    return NextResponse.json({ connected: true, provider: "CalDAV", status: "configured", verified: false }, { status: 201 });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Personal Calendar connection could not be saved." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try { personal(request); assertSameOrigin(request); const removed = await deletePersonalCalendarConnection(); invalidatePersonalCalendarContext(); return NextResponse.json({ disconnected: true, removed }); }
  catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Personal Calendar connection could not be removed." }, { status: 503 }); }
}
