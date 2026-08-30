import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolDataForAccount } from "@/services/school/server";

export async function GET(request: Request) {
  await requireSchoolAccess(request);
  try {
    const account = await requireSchoolAccess(request);
    const school = await getSchoolDataForAccount(account.id);
    return NextResponse.json(school, { headers: { "Cache-Control": "no-store" } });
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
