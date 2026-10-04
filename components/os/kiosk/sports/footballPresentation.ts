import type { SportsEvent } from "@/core/contracts/Sports";
import type { FootballDriveSummary, FootballLiveData, FootballPlay, FootballSituation } from "@/core/contracts/sports/Football";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";
import { footballCountdownLabel, resolveFootballLifecycle, type FootballLifecycleState } from "@/services/sports/football/lifecycle";
import { footballGameStats } from "@/services/sports/football/stats";
import type { FootballGameStats } from "@/core/contracts/sports/Football";
import { footballPlayIdentity } from "./footballAttention";

export type FootballLiveSource = FootballLiveData | CollegeFootballLiveData;
export interface KioskFootballPresentation {
  sportLabel: "NFL" | "CFB"; statusLabel: string; quarterLabel?: string; clock?: string;
  away: { name: string; abbreviation: string; score?: number; record?: string; timeouts?: number; possession: boolean; color?: string };
  home: { name: string; abbreviation: string; score?: number; record?: string; timeouts?: number; possession: boolean; color?: string };
  rankings: string[]; situation?: FootballSituation; latestPlay?: FootballPlay; driveLabel?: string; venue?: string; penaltyText?: string; reviewText?: string;
  penaltyIdentity?: string;
  attention: "normal" | "flag" | "challenge" | "official-review";
  attentionLabel?: string;
  attentionTeam?: string;
  reviewOutcome?: string;
  broadcast?: string;
  stats?: FootballGameStats;
  currentDrive?: FootballDriveSummary;
  lifecycleState: FootballLifecycleState;
  countdownLabel?: string;
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
  return { name: identity?.schoolName ?? identity?.shortName ?? name, abbreviation: identity?.abbreviation ?? abbreviation(name, liveTeam?.team?.abbreviation ?? eventTeam?.abbreviation), score: liveTeam?.score ?? eventTeam?.score, record: liveRecord ?? teamRecord, timeouts, possession: Boolean(hasPossession || (id && id === possessionTeamId)), ...(identity?.accent ? { color: identity.accent } : {}) };
}
export function createFootballPresentation(event: SportsEvent, live?: FootballLiveSource): KioskFootballPresentation {
  const lifecycleState = resolveFootballLifecycle(event, live && { state: "state" in live ? live.state : undefined, statusText: "statusText" in live ? live.statusText : "status" in live ? live.status : undefined });
  const situation = live && "situation" in live ? live.situation : undefined; const period = live && "period" in live ? live.period : situation?.quarter; const clock = live && "clock" in live ? live.clock : situation?.clock; const status = normalizeStatus(live && "status" in live ? live.status : live && "statusText" in live ? live.statusText : event.status); const possessionId = situation?.possessionTeamId;
  const away = teamState(event.sport, event.awayTeam, live?.away, possessionId); const home = teamState(event.sport, event.homeTeam, live?.home, possessionId); const latestPlay = live && "latestPlay" in live ? live.latestPlay : live && "normalizedPlays" in live ? live.normalizedPlays?.at(-1) : undefined; const rankings = live && "rankings" in live ? (live.rankings ?? []).filter((item) => item.rank >= 1 && item.rank <= 25).map((item) => `#${item.rank} ${item.team}`) : [event.awayTeam, event.homeTeam].flatMap((team) => team?.rank !== undefined && team.rank >= 1 && team.rank <= 25 ? [`#${team.rank} ${team.name}`] : []); const currentDrive = live && "currentDrive" in live ? live.currentDrive : undefined; const providerPenalty = live && "penalty" in live && live.penalty && live.penalty.active !== false ? live.penalty : undefined; const penalty = providerPenalty ?? (latestPlay?.penalty ? { text: latestPlay.description, teamId: latestPlay.teamId } : undefined); const review = live && "review" in live ? live.review : undefined;
  const penaltyTeam = penalty?.teamId === homeTeamId(live) ? home.name : penalty?.teamId === awayTeamId(live) ? away.name : undefined;
  const penaltyText = penalty ? [penalty.text, penaltyTeam, penalty.yards !== undefined ? `${penalty.yards}-yard penalty` : undefined].filter(Boolean).join(" · ") : undefined;
  const attention = review?.active ? review.kind ?? "official-review" : penalty ? "flag" : "normal";
  const attentionLabel = attention === "challenge" ? "COACH'S CHALLENGE" : attention === "official-review" ? "OFFICIAL REVIEW" : attention === "flag" ? "FLAG" : undefined;
  const statusLabel = lifecycleState === "upcoming" || lifecycleState === "pregame" ? (lifecycleState === "pregame" ? footballCountdownLabel(event) : "UPCOMING") : lifecycleState === "starting" ? "STARTING · AWAITING LIVE UPDATE" : lifecycleState === "live" ? (status === "end-period" ? "END OF QUARTER" : "LIVE") : lifecycleState === "halftime" ? "HALFTIME" : lifecycleState === "overtime" ? "OVERTIME" : lifecycleState === "delayed" ? "DELAYED" : lifecycleState === "suspended" ? "SUSPENDED" : lifecycleState === "final" ? "FINAL" : "POSTGAME";
  const liveBroadcast = live && "broadcast" in live && live.broadcast && typeof live.broadcast === "object" && "network" in live.broadcast && typeof live.broadcast.network === "string" ? live.broadcast.network : undefined;
  const broadcast = liveBroadcast ?? event.broadcast;
  const stats = live && "stats" in live && live.stats ? live.stats : footballGameStats(live);
  const penaltyIdentity = penalty ? footballPlayIdentity(latestPlay?.penalty ? latestPlay : undefined, penalty) : undefined;
  return { sportLabel: event.sport === "college-football" ? "CFB" : "NFL", statusLabel, ...(lifecycleState === "pregame" ? { countdownLabel: footballCountdownLabel(event) } : {}), lifecycleState, ...(period !== undefined ? { quarterLabel: `Q${period}` } : {}), ...(clock && lifecycleState !== "halftime" && lifecycleState !== "pregame" ? { clock } : {}), away, home, rankings, situation, latestPlay, ...(currentDrive ? { currentDrive } : {}), ...(currentDrive?.description || currentDrive?.result ? { driveLabel: currentDrive.description ?? currentDrive.result } : {}), ...(event.venue ? { venue: event.venue } : {}), ...(broadcast ? { broadcast } : {}), ...(stats ? { stats } : {}), ...(penaltyText ? { penaltyText } : {}), ...(penaltyIdentity ? { penaltyIdentity } : {}), ...(review ? { reviewText: review.text } : {}), attention, ...(attentionLabel ? { attentionLabel } : {}), ...(review?.teamName ? { attentionTeam: review.teamName } : {}), ...(review?.outcome ? { reviewOutcome: review.outcome } : {}) };
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
