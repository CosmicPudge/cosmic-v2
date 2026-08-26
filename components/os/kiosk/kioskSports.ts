import type {
  SportKind,
  SportsEvent,
} from "@/core/contracts/Sports";

export type KioskSport =
  | "nfl"
  | "mlb"
  | "f1"
  | "nascar";

const KIOSK_SPORT_PRIORITY: Record<
  KioskSport,
  number
> = {
  nfl: 400,
  mlb: 300,
  f1: 200,
  nascar: 100,
};

function isKioskSport(
  sport: SportKind,
): sport is KioskSport {
  return (
    sport === "nfl" ||
    sport === "mlb" ||
    sport === "f1" ||
    sport === "nascar"
  );
}

function isAuthoritativeF1Event(event: SportsEvent): boolean {
  return (
    event.source === "espn" &&
    event.provider === "f1-espn-fallback"
  );
}

export function kioskSportPriority(
  sport: SportKind,
): number {
  if (!isKioskSport(sport)) {
    return 0;
  }

  return KIOSK_SPORT_PRIORITY[sport];
}

export function selectKioskLiveEvent(
  events: SportsEvent[],
): SportsEvent | null {
  const liveEvents = events
    .filter(
      (event) =>
        (event.status === "live" || event.status === "delayed") &&
        isKioskSport(event.sport) &&
        (event.sport !== "f1" || isAuthoritativeF1Event(event)),
    )
    .sort((a, b) => {
      const priorityDifference =
        kioskSportPriority(b.sport) -
        kioskSportPriority(a.sport);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (
        a.start.getTime() -
        b.start.getTime()
      );
    });

  return liveEvents[0] ?? null;
}
