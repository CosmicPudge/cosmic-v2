import MLBSportsLab from "@/components/dev/sports/mlb/MLBSportsLab";
import { getSportsSnapshot } from "@/services/sports/snapshot";

export const dynamic = "force-dynamic";

const FALLBACK_GAME_PK = "824155";

function isAngelsGame(event: { awayTeam?: { name?: string }; homeTeam?: { name?: string } }) {
  return [event.awayTeam?.name, event.homeTeam?.name].some((name) => name?.toLowerCase().includes("angels"));
}

async function discoverAngelsGamePk() {
  try {
    const now = new Date();
    const snapshot = await getSportsSnapshot(now);
    const events = [...snapshot.live, ...snapshot.upcoming, ...snapshot.recent]
      .filter((event) => event.sport === "mlb" && isAngelsGame(event))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const today = events.filter((event) => event.start.toDateString() === now.toDateString());
    const live = events.find((event) => event.status === "live" || event.status === "delayed");
    const upcoming = today.find((event) => !["final", "cancelled", "postponed"].includes(event.status) && event.start >= now);
    const completed = today.filter((event) => event.status === "final").at(-1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mostRecent = events.find((event) => event.start < startOfToday);
    return (live ?? upcoming ?? completed ?? mostRecent)?.id.replace(/^mlb:/, "") ?? FALLBACK_GAME_PK;
  } catch {
    return FALLBACK_GAME_PK;
  }
}

export default async function MLBSportsLabPage({ searchParams }: { searchParams: Promise<{ gamePk?: string }> }) {
  const params = await searchParams;
  return <MLBSportsLab initialGamePk={params.gamePk ?? await discoverAngelsGamePk()} />;
}
