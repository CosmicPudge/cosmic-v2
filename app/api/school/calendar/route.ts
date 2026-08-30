import { NextResponse } from "next/server";
import { CanvasCalendarProvider } from "@/components/school/data/providers/CanvasCalendarProvider";
import { requireSchoolAccess } from "@/services/school/access";
import { getProviderCredentials, listProviderConnections, markProviderRefresh } from "@/services/providers/store";

export async function GET(request: Request) {
  await requireSchoolAccess(request);
  try {
    const account = await requireSchoolAccess(request);
    const connection = (await listProviderConnections(account.id)).find((item) => item.provider === "canvas" && item.providerAccountId === "canvas-personal-calendar");
    const credentials = connection ? await getProviderCredentials<{ feedUrl?: unknown }>(account.id, connection.id) : null;
    const provider = new CanvasCalendarProvider(typeof credentials?.feedUrl === "string" ? credentials.feedUrl : undefined);

    const data = await provider.getDashboardData();

    if (connection) await markProviderRefresh(account.id, connection.id);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        events: [],
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
