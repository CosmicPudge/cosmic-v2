import { isRecord, number, records, string } from "./types";
import type { FootballDriveSummary, FootballPlay, FootballScoringPlay, FootballSituation, FootballPenaltyState, FootballReviewState } from "@/core/contracts/sports/Football";
import type { SportsDataSource } from "@/core/contracts/sports/Core";
import { parseFootballFieldPosition } from "@/services/sports/football/field";
import { espnFootballSummaryUrl } from "./espnFootball/endpoints";

export interface CollegeFootballLiveData {
  eventId?: string;
  providerGameId?: string;
  sport?: "college-football";
  generatedAt?: string;
  stale?: boolean;
  sources?: SportsDataSource[];
  status?: string;
  period?: number;
  clock?: string;
  away: { team: { id?: string; name: string; abbreviation?: string; record?: string }; score: number };
  home: { team: { id?: string; name: string; abbreviation?: string; record?: string }; score: number };
  venue?: { name?: string; city?: string; state?: string };
  rankings?: Array<{ team: string; rank: number }>;
  leaders?: Array<{ category: string; name: string; value?: string }>;
  scoringPlays?: string[];
  plays?: string[];
  situation?: FootballSituation;
  normalizedPlays?: FootballPlay[];
  scoringPlayDetails?: FootballScoringPlay[];
  currentDrive?: FootballDriveSummary;
  drives?: FootballDriveSummary[];
  penalty?: FootballPenaltyState;
  review?: FootballReviewState;
  providerUpdatedAt?: string;
  staleAfter?: string;
  sourceAvailability?: Record<string, boolean>;
}

function team(value: unknown) {
  const record = isRecord(value) ? value : {};
  const name = string(record.displayName) ?? string(record.name);
  if (!name) return undefined;
  const id = string(record.id); const abbreviation = string(record.abbreviation);
  const logo = string(record.logo) ?? (records(record.logos)[0] ? string(records(record.logos)[0].href) : undefined);
  return { name, ...(id ? { id } : {}), ...(abbreviation ? { abbreviation } : {}), ...(logo ? { logo } : {}) };
}

function normalizeFootballSituation(raw: Record<string, unknown>, home: ReturnType<typeof team>, away: ReturnType<typeof team>): FootballSituation | undefined {
  const possession = string(raw.possession);
  const possessionTeamId = possession && (possession === home?.id || possession === away?.id) ? possession : undefined;
  const possessionText = string(raw.possessionText) ?? string(raw.downDistanceText);
  const parsed = parseFootballFieldPosition(possessionText);
  const down = number(raw.down);
  const distance = number(raw.distance);
  const hasSituation = possessionTeamId || down !== undefined || distance !== undefined || possessionText;
  if (!hasSituation) return undefined;
  return {
    quarter: number(raw.period),
    clock: string(raw.displayClock) ?? string(raw.clock),
    possessionTeamId,
    down,
    distance,
    fieldPosition: { ...parsed, display: possessionText },
    downDistanceText: string(raw.downDistanceText),
    shortDownDistanceText: string(raw.shortDownDistanceText),
    possessionText,
    redZone: typeof raw.isRedZone === "boolean" ? raw.isRedZone : undefined,
  };
}

function normalizeCollegePlay(raw: Record<string, unknown>, sequence: number): FootballPlay | undefined {
  const description = string(raw.text) ?? string(raw.description);
  if (!description) return undefined;
  const lower = description.toLowerCase();
  const type: FootballPlay["type"] = lower.includes("intercept") ? "interception" : lower.includes("sack") ? "sack" : lower.includes("fumble") ? "fumble" : lower.includes("punt") ? "punt" : lower.includes("pass") ? "pass" : lower.includes("rush") || lower.includes("run") ? "rush" : lower.includes("field goal") ? "field-goal" : "other";
  const start = isRecord(raw.start) ? raw.start : {};
  const scoring = raw.scoringPlay === true;
  const penalty = raw.penalty === true || lower.includes("penalty");
  const penaltyYards = number(raw.penaltyYards) ?? number(raw.yardsPenalized);
  return {
    id: string(raw.id), sequence, period: number(raw.period) ?? number(raw.periodNumber), clock: string(raw.clock?.toString()), type,
    description, shortDescription: string(raw.shortText), teamId: string(isRecord(raw.team) ? raw.team.id : raw.teamId),
    down: number(start.down) ?? number(raw.down), distance: number(start.distance) ?? number(raw.distance),
    downDistanceText: string(start.downDistanceText) ?? string(raw.downDistanceText), possessionText: string(start.possessionText),
    yardLine: number(start.yardLine) ?? number(raw.yardLine), yardsToEndzone: number(start.yardsToEndzone), yardsGained: number(raw.yards),
    scoringPlay: scoring, touchdown: scoring && lower.includes("touchdown"), turnover: raw.turnover === true || lower.includes("intercept") || lower.includes("fumble"),
    penalty, ...(penaltyYards !== undefined ? { penaltyYards } : {}), firstDown: raw.firstDown === true || lower.includes("first down"), sack: type === "sack", interception: type === "interception", fumble: type === "fumble",
  };
}

export function normalizeCollegeFootballSummary(payload: unknown): CollegeFootballLiveData | null {
  const root = isRecord(payload) ? payload : {};
  const header = isRecord(root.header) ? root.header : {};
  const competition = records(header.competitions)[0];
  if (!competition) return null;
  const competitors = records(competition.competitors);
  const away = competitors.find((item) => string(item.homeAway) === "away");
  const home = competitors.find((item) => string(item.homeAway) === "home");
  const awayTeam = team(away?.team); const homeTeam = team(home?.team);
  if (!awayTeam || !homeTeam) return null;
  const status = isRecord(competition.status) && isRecord(competition.status.type) ? competition.status.type : {};
  const situation = isRecord(competition.situation) ? competition.situation : {};
  const venue = isRecord(competition.venue) ? competition.venue : {};
  const leaders = records(root.leaders).flatMap((group) => {
    const category = string(group.name) ?? string(group.displayName);
    const leader = records(group.leaders)[0];
    const athlete = isRecord(leader?.athlete) ? leader.athlete : {};
    const name = string(athlete.displayName) ?? string(athlete.fullName);
    const value = string(leader?.displayValue);
    return category && name ? [{ category, name, ...(value ? { value } : {}) }] : [];
  });
  const rawPlays = records(root.plays);
  const normalizedPlays = rawPlays.flatMap((play, index) => normalizeCollegePlay(play, index) ? [normalizeCollegePlay(play, index) as FootballPlay] : []);
  const plays = normalizedPlays.map((play) => play.description);
  const scoringPlays = normalizedPlays.filter((play) => play.scoringPlay).map((play) => play.description);
  const scoringPlayDetails = normalizedPlays.filter((play) => play.scoringPlay).map((play): FootballScoringPlay => ({ id: play.id, period: play.period, clock: play.clock, teamId: play.teamId, description: play.description, type: play.type, ...(play.touchdown ? { points: 6 } : {}) }));
  const normalizedSituation = normalizeFootballSituation(situation, homeTeam, awayTeam);
  const rawDrives = records(root.drives);
  const drives = rawDrives.flatMap((drive, index) => {
    const teamId = string(isRecord(drive.team) ? drive.team.id : drive.teamId);
    const description = string(drive.description) ?? string(drive.displayResult) ?? string(drive.result);
    return description || teamId ? [{ id: string(drive.id) ?? `cfb-drive-${index}`, teamId, teamAbbreviation: string(isRecord(drive.team) ? drive.team.abbreviation : undefined), description, result: string(drive.displayResult) ?? string(drive.result), plays: number(drive.plays), yards: number(drive.yards), scoringDrive: drive.isScore === true || drive.scoringDrive === true }] : [];
  });
  const rankings = competitors.flatMap((item) => { const name = team(item.team)?.name; const rank = isRecord(item.curatedRank) ? number(item.curatedRank.current) : undefined; return name && rank !== undefined ? [{ team: name, rank }] : []; });
  const latestPlay = normalizedPlays.at(-1);
  const penalty = latestPlay?.penalty ? { text: latestPlay.description, teamId: latestPlay.teamId, ...(latestPlay.penaltyYards !== undefined ? { yards: latestPlay.penaltyYards } : {}) } : undefined;
  const reviewRecord = isRecord(competition.review) ? competition.review : undefined;
  const reviewValue = string(reviewRecord?.text) ?? string(reviewRecord?.description) ?? (isRecord(competition.status) ? string(competition.status.detail) ?? string(competition.status.description) : undefined);
  const reviewTeam = isRecord(reviewRecord?.team) ? reviewRecord.team : undefined;
  const reviewOutcome = string(reviewRecord?.outcome) ?? string(reviewRecord?.result);
  const review = reviewValue && /review|challenge/i.test(reviewValue) ? { text: reviewValue, active: !/final|complete|overturned|upheld|stands/i.test(reviewValue), kind: /official/i.test(reviewValue) ? "official-review" as const : "challenge" as const, ...(reviewOutcome ? { outcome: reviewOutcome } : {}), ...(string(reviewTeam?.id) ? { teamId: string(reviewTeam?.id) } : {}), ...(string(reviewTeam?.displayName) || string(reviewTeam?.name) ? { teamName: string(reviewTeam?.displayName) ?? string(reviewTeam?.name) } : {}) } : undefined;
  return {
    status: string(status.detail) ?? string(status.description),
    period: number(situation.period) ?? number(status.period),
    clock: string(situation.displayClock) ?? string(status.displayClock),
    away: { team: { ...awayTeam, ...(records(away?.records)[0] && string(records(away?.records)[0].summary) ? { record: string(records(away?.records)[0].summary) } : {}) }, score: number(away?.score) ?? 0 },
    home: { team: { ...homeTeam, ...(records(home?.records)[0] && string(records(home?.records)[0].summary) ? { record: string(records(home?.records)[0].summary) } : {}) }, score: number(home?.score) ?? 0 },
    ...(string(venue.fullName) || string(venue.address) ? { venue: { ...(string(venue.fullName) ? { name: string(venue.fullName) } : {}), ...(isRecord(venue.address) && string(venue.address.city) ? { city: string(venue.address.city) } : {}), ...(isRecord(venue.address) && string(venue.address.state) ? { state: string(venue.address.state) } : {}) } } : {}),
    ...(rankings.length ? { rankings } : {}), ...(leaders.length ? { leaders } : {}), ...(plays.length ? { plays } : {}), ...(scoringPlays.length ? { scoringPlays } : {}),
    ...(normalizedSituation ? { situation: normalizedSituation } : {}),
    ...(normalizedPlays.length ? { normalizedPlays } : {}),
    ...(scoringPlayDetails.length ? { scoringPlayDetails } : {}),
    ...(drives.length ? { drives, currentDrive: drives[drives.length - 1] } : {}),
    ...(penalty ? { penalty } : {}), ...(review ? { review } : {}),
    eventId: string(header.id) ?? undefined,
    providerGameId: string(header.id) ?? undefined,
    sport: "college-football",
    generatedAt: new Date().toISOString(),
    stale: false,
    sources: [{ id: "espn-college-football-summary", sport: "college-football", name: "ESPN College Football Summary", official: false, status: "ok", capabilities: { schedule: false, liveScore: true, liveState: true, playByPlay: true, stats: true }, cacheSeconds: 5 }],
    sourceAvailability: { score: true, period: Boolean(number(situation.period) ?? number(status.period)), clock: Boolean(string(situation.displayClock) ?? string(status.displayClock)), possession: Boolean(normalizedSituation?.possessionTeamId), downDistance: Boolean(normalizedSituation?.downDistanceText), ballPosition: Boolean(normalizedSituation?.fieldPosition?.display), lastPlay: Boolean(latestPlay), drive: Boolean(drives.length), rankings: rankings.length > 0, penalty: Boolean(penalty), review: Boolean(review) },
  };
}

export async function getCollegeFootballLiveData(eventId: number | string): Promise<CollegeFootballLiveData> {
  const response = await fetch(espnFootballSummaryUrl("college-football", String(eventId)), { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`ESPN College Football summary failed: ${response.status}`);
  const normalized = normalizeCollegeFootballSummary(await response.json());
  if (!normalized) throw new Error("College Football summary did not contain two teams.");
  return normalized;
}
