import { NextResponse } from "next/server";
import { parseCanvasCalendarWithDiagnostics } from "@/components/school/data/parser";
import { buildDashboard } from "@/components/school/data/engine/engine";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";

// This endpoint exists solely for localhost development of the manual-first School UI.
// Account-backed deployments continue using the authenticated, encrypted connection.
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside local development." }, { status: 404 });
  }
  try {
    assertSameOrigin(request);
    const host = request.headers.get("host")?.split(":")[0];
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]") {
      return NextResponse.json({ error: "Localhost only." }, { status: 403 });
    }
    const body = await request.json().catch(() => null) as { feedUrl?: unknown } | null;
    if (typeof body?.feedUrl !== "string" || body.feedUrl.length > 2048) {
      return NextResponse.json({ error: "Enter a Canvas calendar feed URL." }, { status: 400 });
    }
    const url = new URL(body.feedUrl);
    if (url.protocol !== "https:" || url.hostname !== "usu.instructure.com" ||
        url.username || url.password || url.port || !url.pathname.startsWith("/feeds/calendars/")) {
      return NextResponse.json({ error: "Use the personal HTTPS Canvas calendar feed URL from usu.instructure.com." }, { status: 400 });
    }
    const response = await fetch(url.toString(), { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { Accept: "text/calendar" } });
    if (!response.ok) throw new Error("Canvas feed could not be fetched.");
    const claimedSize = Number(response.headers.get("content-length") ?? 0);
    if (claimedSize > 3_000_000) throw new Error("Canvas calendar feed is too large.");
    const bodyText = await response.text();
    if (bodyText.length > 3_000_000) throw new Error("Canvas calendar feed is too large.");
    const parsed = parseCanvasCalendarWithDiagnostics(bodyText);
    return NextResponse.json({ data: buildDashboard(parsed.events), diagnostics: parsed.diagnostics }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not import Canvas calendar. Check your feed URL and try again." }, { status: 502 });
  }
}
