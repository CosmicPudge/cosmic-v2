import type { SportsEvent } from "@/core/contracts/Sports";
import type { FootballLiveData, FootballPlay, FootballSituation } from "@/core/contracts/sports/Football";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";

export type FootballLiveSource = FootballLiveData | CollegeFootballLiveData;
export interface KioskFootballPresentation {
  sportLabel: "NFL" | "CFB"; statusLabel: string; quarterLabel?: string; clock?: string;
  away: { name: string; abbreviation: string; score: number; record?: string; timeouts?: number; possession: boolean; color?: string };
  home: { name: string; abbreviation: string; score: number; record?: string; timeouts?: number; possession: boolean; color?: string };
  rankings: string[]; situation?: FootballSituation; latestPlay?: FootballPlay; driveLabel?: string; venue?: string; penaltyText?: string; reviewText?: string;
  attention: "normal" | "flag" | "challenge" | "official-review";
  attentionLabel?: string;
  attentionTeam?: string;
  reviewOutcome?: string;
}
function abbreviation(name: string, value?: string) { const aliases: Record<string, string> = { BOIS: "BSU", BOISE: "BSU", USTA: "USU" }; return aliases[value?.toUpperCase() ?? ""] ?? value?.toUpperCase() ?? name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase(); }
function teamState(sport: SportsEvent["sport"], eventTeam: SportsEvent["homeTeam"] | SportsEvent["awayTeam"], liveTeam: FootballLiveSource["home"] | undefined, possessionTeamId?: string) {
  const liveRecord = liveTeam && "record" in liveTeam ? liveTeam.record : undefined;
  const teamRecord = liveTeam?.team && "record" in liveTeam.team ? liveTeam.team.record : undefined;
  const timeouts = liveTeam && "timeoutsRemaining" in liveTeam ? liveTeam.timeoutsRemaining : undefined;
  const hasPossession = liveTeam && "possession" in liveTeam ? liveTeam.possession : false;
  const name = liveTeam?.team?.name ?? eventTeam?.name ?? "Unknown";
  const id = liveTeam?.team?.id ?? eventTeam?.id;
  const identity = resolveSportsTeamIdentity(sport, { id, name, abbreviation: liveTeam?.team?.abbreviation ?? eventTeam?.abbreviation });
  return { name, abbreviation: abbreviation(name, liveTeam?.team?.abbreviation ?? eventTeam?.abbreviation), score: liveTeam?.score ?? eventTeam?.score ?? 0, record: liveRecord ?? teamRecord, timeouts, possession: Boolean(hasPossession || (id && id === possessionTeamId)), ...(identity?.accent ? { color: identity.accent } : {}) };
}
export function createFootballPresentation(event: SportsEvent, live?: FootballLiveSource): KioskFootballPresentation {
  const situation = live && "situation" in live ? live.situation : undefined; const period = live && "period" in live ? live.period : situation?.quarter; const clock = live && "clock" in live ? live.clock : situation?.clock; const status = normalizeStatus(live && "status" in live ? live.status : live && "statusText" in live ? live.statusText : event.status); const possessionId = situation?.possessionTeamId;
  const away = teamState(event.sport, event.awayTeam, live?.away, possessionId); const home = teamState(event.sport, event.homeTeam, live?.home, possessionId); const latestPlay = live && "latestPlay" in live ? live.latestPlay : live && "normalizedPlays" in live ? live.normalizedPlays?.at(-1) : undefined; const rankings = live && "rankings" in live ? (live.rankings ?? []).map((item) => `#${item.rank} ${item.team}`) : []; const currentDrive = live && "currentDrive" in live ? live.currentDrive : undefined; const penalty = live && "penalty" in live ? live.penalty : latestPlay?.penalty ? { text: latestPlay.description, teamId: latestPlay.teamId } : undefined; const review = live && "review" in live ? live.review : undefined;
  const penaltyTeam = penalty?.teamId === homeTeamId(live) ? home.name : penalty?.teamId === awayTeamId(live) ? away.name : undefined;
  const penaltyText = penalty ? [penalty.text, penaltyTeam, penalty.yards !== undefined ? `${penalty.yards}-yard penalty` : undefined].filter(Boolean).join(" · ") : undefined;
  const attention = review?.active ? review.kind ?? "official-review" : penalty ? "flag" : "normal";
  const attentionLabel = attention === "challenge" ? "COACH'S CHALLENGE" : attention === "official-review" ? "OFFICIAL REVIEW" : attention === "flag" ? "FLAG" : undefined;
  return { sportLabel: event.sport === "college-football" ? "CFB" : "NFL", statusLabel: status === "live" ? "LIVE" : status === "halftime" ? "HALFTIME" : status === "overtime" ? "OVERTIME" : status === "end-period" ? "END OF QUARTER" : status === "delayed" ? "DELAYED" : status === "final" ? "FINAL" : status === "suspended" ? "SUSPENDED" : "STARTING · AWAITING LIVE UPDATE", ...(period !== undefined ? { quarterLabel: `Q${period}` } : {}), ...(clock && status !== "halftime" ? { clock } : {}), away, home, rankings, situation, latestPlay, ...(currentDrive?.description || currentDrive?.result ? { driveLabel: currentDrive.description ?? currentDrive.result } : {}), ...(event.venue ? { venue: event.venue } : {}), ...(penaltyText ? { penaltyText } : {}), ...(review ? { reviewText: review.text } : {}), attention, ...(attentionLabel ? { attentionLabel } : {}), ...(review?.teamName ? { attentionTeam: review.teamName } : {}), ...(review?.outcome ? { reviewOutcome: review.outcome } : {}) };
}

function normalizeStatus(value?: string) {
  const status = value?.toLowerCase() ?? "scheduled";
  if (status.includes("half")) return "halftime";
  if (status.includes("overtime")) return "overtime";
  if (status.includes("final")) return "final";
  if (status.includes("delay")) return "delayed";
  if (status.includes("suspend")) return "suspended";
  if (status.includes("live") || status.includes("progress") || status.includes("quarter")) return "live";
  return status;
}

function homeTeamId(live?: FootballLiveSource) { return live?.home?.team?.id; }
function awayTeamId(live?: FootballLiveSource) { return live?.away?.team?.id; }
