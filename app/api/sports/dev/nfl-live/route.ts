import { getNFLLiveData } from "@/services/sports/providers/nfl/live";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
) {
  const url =
    new URL(request.url);

  const eventId =
    url.searchParams.get("eventId");

  if (!eventId) {
    return Response.json(
      {
        error:
          "Missing eventId query parameter.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const data =
      await getNFLLiveData(
        eventId,
      );

    return Response.json(
      data,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[Sports][NFL] Live provider failed:",
      error,
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown NFL provider error.",
      },
      {
        status: 500,
      },
    );
  }
}