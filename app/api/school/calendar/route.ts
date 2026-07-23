import { NextResponse } from "next/server";
import { CanvasCalendarProvider } from "@/components/school/data/providers/CanvasCalendarProvider";

export async function GET() {
  try {
    const provider = new CanvasCalendarProvider();

    const data = await provider.getDashboardData();

    return NextResponse.json(data);
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