import { getCollegeFootballDirectory, collegeFootballDirectoryUrl } from "@/services/sports/providers/college-football-directory";

export async function GET() {
  try {
    const teams = await getCollegeFootballDirectory();
    return Response.json({ teams, source: collegeFootballDirectoryUrl, lastUpdated: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } });
  } catch {
    return Response.json({ error: "College Football team directory is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
