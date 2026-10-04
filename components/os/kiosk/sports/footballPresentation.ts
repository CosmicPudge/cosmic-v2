import type { SportsEvent } from "@/core/contracts/Sports";
import type { FootballLiveData, FootballPlay, FootballSituation } from "@/core/contracts/sports/Football";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";

export type FootballLiveSource = FootballLiveData | CollegeFootballLiveData;
export interface KioskFootballPresentation {
  sportLabel: "NFL" | "CFB"; statusLabel: string; quarterLabel?: string; clock?: string;
  away: { name: string; abbreviation: string; score: number; record?: string; timeouts?: number; possession: boolean };
  home: { name: string; abbreviation: string; score: number; record?: string; timeouts?: number; possession: boolean };
  rankings: string[]; situation?: FootballSituation; latestPlay?: FootballPlay; driveLabel?: string; venue?: string; penaltyText?: string; reviewText?: string;
}
function abbreviation(name: string, value?: string) { const aliases: Record<string, string> = { BOIS: "BSU", BOISE: "BSU", USTA: "USU" }; return aliases[value?.toUpperCase() ?? ""] ?? value?.toUpperCase() ?? name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase(); }
function teamState(eventTeam: SportsEvent["homeTeam"] | SportsEvent["awayTeam"], liveTeam: FootballLiveSource["home"] | undefined, possessionTeamId?: string) {
  const liveRecord = liveTeam && "record" in liveTeam ? liveTeam.record : undefined;
  const teamRecord = liveTeam?.team && "record" in liveTeam.team ? liveTeam.team.record : undefined;
  const timeouts = liveTeam && "timeoutsRemaining" in liveTeam ? liveTeam.timeoutsRemaining : undefined;
  const hasPossession = liveTeam && "possession" in liveTeam ? liveTeam.possession : false;
  const name = liveTeam?.team?.name ?? eventTeam?.name ?? "Unknown";
  const id = liveTeam?.team?.id ?? eventTeam?.id;
  return { name, abbreviation: abbreviation(name, liveTeam?.team?.abbreviation ?? eventTeam?.abbreviation), score: liveTeam?.score ?? eventTeam?.score ?? 0, record: liveRecord ?? teamRecord, timeouts, possession: Boolean(hasPossession || (id && id === possessionTeamId)) };
}
export function createFootballPresentation(event: SportsEvent, live?: FootballLiveSource): KioskFootballPresentation {
  const situation = live && "situation" in live ? live.situation : undefined; const period = live && "period" in live ? live.period : situation?.quarter; const clock = live && "clock" in live ? live.clock : situation?.clock; const status = live && "status" in live ? live.status : event.status; const possessionId = situation?.possessionTeamId;
  const away = teamState(event.awayTeam, live?.away, possessionId); const home = teamState(event.homeTeam, live?.home, possessionId); const latestPlay = live && "latestPlay" in live ? live.latestPlay : live && "normalizedPlays" in live ? live.normalizedPlays?.at(-1) : undefined; const rankings = live && "rankings" in live ? (live.rankings ?? []).map((item) => `#${item.rank} ${item.team}`) : []; const currentDrive = live && "currentDrive" in live ? live.currentDrive : undefined; const penalty = live && "penalty" in live ? live.penalty : undefined; const review = live && "review" in live ? live.review : undefined;
  return { sportLabel: event.sport === "college-football" ? "CFB" : "NFL", statusLabel: status === "live" ? "LIVE" : status === "delayed" ? "DELAYED" : status === "final" ? "FINAL" : status === "suspended" ? "SUSPENDED" : "STARTING · AWAITING LIVE UPDATE", ...(period !== undefined ? { quarterLabel: `Q${period}` } : {}), ...(clock ? { clock } : {}), away, home, rankings, situation, latestPlay, ...(currentDrive?.description || currentDrive?.result ? { driveLabel: currentDrive.description ?? currentDrive.result } : {}), ...(event.venue ? { venue: event.venue } : {}), ...(penalty ? { penaltyText: penalty.text } : {}), ...(review ? { reviewText: review.text } : {}) };
}
