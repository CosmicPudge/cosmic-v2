import type { SportKind, SportsEvent } from "@/core/contracts/Sports";
import { getSportsSnapshot } from "@/services/sports/snapshot";
import { kioskBootId, requireAuthenticatedSession } from "@/services/auth/server";
import { getAccountPreferences } from "@/services/settings/accountPreferences";
import { referencePreferences } from "@/services/settings/preferences";
import { isDatabaseConfigured } from "@/services/database/client";
import { isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";
import { eventMatchesKioskPreferences } from "@/services/sports/preferences";

function isSportKind(value: string): value is SportKind {
  return value === "mlb" || value === "nfl" || value === "nba" || value === "mls" || value === "f1" || value === "nascar" || value === "college-football";
}

export async function GET(request: Request) {
  const developerKiosk = isDeveloperKioskRequest(request);
  const account = developerKiosk ? null : (await requireAuthenticatedSession(request, { allowDevice: true, bootId: kioskBootId(request) })).account;
  const preferences = account && isDatabaseConfigured() ? await getAccountPreferences(account.id) : referencePreferences;
  const kioskEligibility = new URL(request.url).searchParams.get("kiosk") === "true";
  const requestedSport = new URL(request.url).searchParams.get("sport");
  const snapshot = await getSportsSnapshot(new Date(), preferences);
  const filter = (event: SportsEvent) => kioskEligibility ? eventMatchesKioskPreferences(event, preferences) : true;
  const filteredSnapshot = kioskEligibility ? {
    ...snapshot,
    live: snapshot.live.filter(filter),
    upcoming: snapshot.upcoming.filter(filter),
    recent: snapshot.recent.filter(filter),
    featured: snapshot.featured.filter(filter),
  } : snapshot;
  if (!requestedSport) {
    return Response.json(filteredSnapshot);
  }

  if (!isSportKind(requestedSport)) {
    return Response.json({ error: "Unsupported sport filter." }, { status: 400 });
  }

  const sport = requestedSport;
  return Response.json({
    ...filteredSnapshot,
    live: filteredSnapshot.live.filter((event) => event.sport === sport),
    upcoming: filteredSnapshot.upcoming.filter((event) => event.sport === sport),
    recent: filteredSnapshot.recent.filter((event) => event.sport === sport),
    featured: filteredSnapshot.featured.filter((event) => event.sport === sport),
    standings: filteredSnapshot.standings[sport] ? { [sport]: filteredSnapshot.standings[sport] } : {},
    providerErrors: filteredSnapshot.providerErrors.filter((error) => error.sport === sport),
  });
}
