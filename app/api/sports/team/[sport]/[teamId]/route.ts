import { sportsDirectory } from "@/services/sports/directory";
import { EspnTeamProvider } from "@/services/sports/providers/espn-team";
import { MlbAngelsProvider } from "@/services/sports/providers/mlb";
import type { SportKind } from "@/core/contracts/Sports";

const NBA_IDS: Record<string, string> = { hawks: "1", celtics: "2", nets: "17", hornets: "30", bulls: "4", cavaliers: "5", mavericks: "6", nuggets: "7", pistons: "8", warriors: "9", rockets: "10", pacers: "11", clippers: "12", lakers: "13", grizzlies: "29", heat: "14", bucks: "15", timberwolves: "16", pelicans: "3", knicks: "18", thunder: "25", magic: "19", "76ers": "20", suns: "21", blazers: "22", kings: "23", spurs: "24", raptors: "28", jazz: "26", wizards: "27" };

export async function GET(_request: Request, { params }: { params: Promise<{ sport: string; teamId: string }> }) {
  const { sport, teamId } = await params;
  if (sport !== "nfl" && sport !== "mlb" && sport !== "nba") return Response.json({ error: "Unsupported team sport." }, { status: 400 });
  const entry = sportsDirectory.find((item) => item.sport === sport && item.id === `${sport}-${teamId}`);
  if (!entry) return Response.json({ error: "Team was not found." }, { status: 404 });
  const provider = sport === "mlb"
    ? new MlbAngelsProvider({ teamId: entry.providerId, teamName: entry.name })
    : new EspnTeamProvider({ id: `${sport}-team-${teamId}`, sport: sport as Extract<SportKind, "nfl" | "nba">, teamId: entry.providerId ?? NBA_IDS[teamId] ?? teamId, leaguePath: sport === "nfl" ? "football/nfl" : "basketball/nba", cacheSeconds: 900 });
  try {
    const snapshot = await provider.getSnapshot(new Date());
    return Response.json({ team: entry, events: snapshot.events, standings: snapshot.standings ?? [], lastUpdated: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
  } catch { return Response.json({ error: "Team data is temporarily unavailable." }, { status: 503 }); }
}
