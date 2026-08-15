import { getAppleCalendarWriter } from "@/core/serverCosmic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const writer = getAppleCalendarWriter();

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
