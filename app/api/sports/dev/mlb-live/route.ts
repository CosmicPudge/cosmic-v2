import { getMLBLiveData } from "@/services/sports/providers/mlb/live";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
) {
  const url =
    new URL(request.url);

  const gamePk =
    url.searchParams.get("gamePk");

  if (!gamePk) {
    return Response.json(
      {
        error:
          "Missing gamePk query parameter.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const data =
      await getMLBLiveData(gamePk);

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
      "[Sports][MLB] Live provider failed:",
      error,
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown MLB provider error.",
      },
      {
        status: 500,
      },
    );
  }
}