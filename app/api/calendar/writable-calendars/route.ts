import { getAccountCalendarWriter } from "@/core/serverCosmic";
import { requireCosmicAccount } from "@/services/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") await requireCosmicAccount(request);
    const writer = await getAccountCalendarWriter(request);

    if (!writer) {
      return Response.json({ calendars: [] });
    }

    return Response.json({
      calendars: await writer.getWritableCalendars(),
    });
  } catch (error) {
    console.error(
      "Writable calendar discovery failed:",
      error instanceof Error ? error.message : "Unknown calendar error"
    );

    return Response.json(
      { error: "Writable calendars are temporarily unavailable." },
      { status: 503 }
    );
  }
}
