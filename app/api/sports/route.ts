import type { SportKind } from "@/core/contracts/Sports";
import { getSportsSnapshot } from "@/services/sports/snapshot";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getAccountPreferences } from "@/services/settings/accountPreferences";
import { referencePreferences } from "@/services/settings/preferences";

function isSportKind(value: string): value is SportKind {
  return value === "mlb" || value === "nfl" || value === "nba" || value === "mls" || value === "f1" || value === "nascar" || value === "college-football";
}

export async function GET(request: Request) {
  const account = await getCurrentCosmicAccount(request);
  const preferences = account && process.env.DATABASE_URL ? await getAccountPreferences(account.id) : referencePreferences;
  const requestedSport = new URL(request.url).searchParams.get("sport");
  if (!requestedSport) {
    return Response.json(await getSportsSnapshot(new Date(), preferences));
  }

  if (!isSportKind(requestedSport)) {
    return Response.json({ error: "Unsupported sport filter." }, { status: 400 });
  }

  const snapshot = await getSportsSnapshot(new Date(), preferences);
  const sport = requestedSport;
  return Response.json({
    ...snapshot,
    live: snapshot.live.filter((event) => event.sport === sport),
    upcoming: snapshot.upcoming.filter((event) => event.sport === sport),
    recent: snapshot.recent.filter((event) => event.sport === sport),
    featured: snapshot.featured.filter((event) => event.sport === sport),
    standings: snapshot.standings[sport] ? { [sport]: snapshot.standings[sport] } : {},
    providerErrors: snapshot.providerErrors.filter((error) => error.sport === sport),
  });
}
