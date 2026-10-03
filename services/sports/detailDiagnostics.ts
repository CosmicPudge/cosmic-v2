export type SportsDetailPresence = {
  detail: boolean;
  inning?: boolean;
  outs?: boolean;
  count?: boolean;
  bases?: boolean;
  batter?: boolean;
  pitcher?: boolean;
  lastPlay?: boolean;
  linescore?: boolean;
  pitch?: boolean;
};

export function sportsDetailPresence(value: unknown): SportsDetailPresence {
  if (!value || typeof value !== "object" || (value as { sport?: unknown }).sport !== "mlb") return { detail: false };
  const live = value as { inning?: unknown; count?: { outs?: unknown; balls?: unknown; strikes?: unknown }; bases?: unknown; matchup?: { batter?: unknown; pitcher?: unknown }; latestPlay?: unknown; linescore?: unknown; latestPitch?: unknown };
  return { detail: true, inning: live.inning !== undefined, outs: live.count?.outs !== undefined, count: live.count?.balls !== undefined || live.count?.strikes !== undefined, bases: Boolean(live.bases), batter: Boolean(live.matchup?.batter), pitcher: Boolean(live.matchup?.pitcher), lastPlay: Boolean(live.latestPlay), linescore: Boolean(live.linescore), pitch: Boolean(live.latestPitch) };
}

export function sportsDetailIsComplete(presence: SportsDetailPresence) {
  return presence.detail && Object.entries(presence).filter(([key]) => key !== "detail").every(([, value]) => value === true);
}
