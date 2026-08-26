"use client";

import type { CSSProperties } from "react";
import type { SportsEvent } from "@/core/contracts/Sports";
import type {
  BaseballBases,
  BaseballLiveData,
  BaseballPlayerRef,
  BaseballUniform,
} from "@/core/contracts/sports/Baseball";
import { resolveMlbGameTeamTheme } from "@/services/sports/providers/mlb/teamThemes";

interface KioskBaseballViewProps {
  event: SportsEvent;
  live?: BaseballLiveData;
}

interface TeamDisplay {
  id?: string;
  name: string;
  abbreviation?: string;
  score?: number;
  record?: string;
  uniform?: BaseballUniform;
}

function splitTeamName(name: string) {
  const words = name.trim().split(/\s+/);
  return {
    city: words.slice(0, -1).join(" "),
    nickname: words.at(-1) ?? name,
  };
}

function inningLabel(live: BaseballLiveData | undefined, event: SportsEvent) {
  if (!live?.inning) return event.statusDetail ?? "LIVE";
  const half = live.inningHalf === "bottom" ? "BOTTOM" : live.inningHalf === "top" ? "TOP" : "LIVE";
  return `${half} ${live.inning}${live.inningHalf === "top" || live.inningHalf === "bottom" ? "TH" : ""}`;
}

function playerFirstName(player?: BaseballPlayerRef) {
  return player?.name.split(" ").slice(0, -1).join(" ") ?? "";
}

function playerLastName(player?: BaseballPlayerRef) {
  return player?.name.split(" ").at(-1) ?? "";
}

export default function KioskBaseballView({ event, live }: KioskBaseballViewProps) {
  const away: TeamDisplay = { ...(live?.away.team ?? event.awayTeam ?? { name: "Away" }), score: event.awayTeam?.score, record: event.awayTeam?.record, uniform: live?.away.uniform };
  const home: TeamDisplay = { ...(live?.home.team ?? event.homeTeam ?? { name: "Home" }), score: event.homeTeam?.score, record: event.homeTeam?.record, uniform: live?.home.uniform };
  const awayTheme = resolveMlbGameTeamTheme(away, away.uniform);
  const homeTheme = resolveMlbGameTeamTheme(home, home.uniform);
  const batter = live?.matchup?.batter;
  const pitcher = live?.matchup?.pitcher;
  const pitcherStats = pitcher?.id
    ? [...(live?.boxScore?.away?.players ?? []), ...(live?.boxScore?.home?.players ?? [])]
        .find((player) => player.player.id === pitcher.id)?.pitching
    : undefined;

  const style = {
    "--away-primary": awayTheme.primary,
    "--away-secondary": awayTheme.secondary,
    "--away-accent": awayTheme.accent,
    "--away-text": "text" in awayTheme ? awayTheme.text : awayTheme.textOnPrimary,
    "--away-muted-text": "mutedText" in awayTheme ? awayTheme.mutedText : "rgba(255,255,255,.62)",
    "--away-bg-start": "backgroundStart" in awayTheme ? awayTheme.backgroundStart : awayTheme.secondary,
    "--away-bg-end": "backgroundEnd" in awayTheme ? awayTheme.backgroundEnd : awayTheme.primary,
    "--away-panel-tint": "panelTint" in awayTheme ? awayTheme.panelTint : awayTheme.accent,
    "--away-watermark-tint": "watermarkTint" in awayTheme ? awayTheme.watermarkTint : awayTheme.accent,
    "--home-primary": homeTheme.primary,
    "--home-secondary": homeTheme.secondary,
    "--home-accent": homeTheme.accent,
    "--home-text": "text" in homeTheme ? homeTheme.text : homeTheme.textOnPrimary,
    "--home-muted-text": "mutedText" in homeTheme ? homeTheme.mutedText : "rgba(255,255,255,.62)",
    "--home-bg-start": "backgroundStart" in homeTheme ? homeTheme.backgroundStart : homeTheme.secondary,
    "--home-bg-end": "backgroundEnd" in homeTheme ? homeTheme.backgroundEnd : homeTheme.primary,
    "--home-panel-tint": "panelTint" in homeTheme ? homeTheme.panelTint : homeTheme.accent,
    "--home-watermark-tint": "watermarkTint" in homeTheme ? homeTheme.watermarkTint : homeTheme.accent,
  } as CSSProperties;

  return (
    <div className="kiosk-sports-view baseball-broadcast-wrap">
      <section className="baseball-broadcast" style={style} aria-label={`${event.title} live game center`}>
        <BroadcastHeader />

        <main className="baseball-broadcast-main">
          <div className="baseball-watermark baseball-watermark-away" aria-hidden="true">
            <Logo team={away} theme={awayTheme} />
          </div>
          <div className="baseball-watermark baseball-watermark-home" aria-hidden="true">
            <Logo team={home} theme={homeTheme} />
          </div>

          <div className="broadcast-upper">
            <TeamZone team={away} theme={awayTheme} side="away" score={live?.away.score ?? away.score} />
            <GameState live={live} event={event} />
            <TeamZone team={home} theme={homeTheme} side="home" score={live?.home.score ?? home.score} />
          </div>

          <MatchupZone batter={batter} pitcher={pitcher} pitcherEra={pitcherStats?.era} />
          <LastPlayZone description={live?.latestPlay?.description} />

          <div className="broadcast-lower">
            <LineScoreZone live={live} away={away} home={home} />
            <GameStatsZone live={live} />
            <PitchInfoZone pitch={live?.latestPitch} pitchCount={pitcherStats?.pitchesThrown} />
          </div>
        </main>

        <BroadcastFooter event={event} live={live} />
      </section>
    </div>
  );
}

function BroadcastHeader() {
  return (
    <header className="broadcast-header">
      <p><span className="broadcast-live-dot" /> LIVE <span aria-hidden="true">•</span> MLB</p>
      <p>COSMIC SPORTS</p>
    </header>
  );
}

function TeamZone({ team, theme, side, score }: { team: TeamDisplay; theme: ReturnType<typeof resolveMlbGameTeamTheme>; side: "away" | "home"; score?: number }) {
  const { city, nickname } = splitTeamName(team.name);
  return (
    <section className={`team-zone team-zone-${side}`} aria-label={`${team.name}, ${score ?? "score unavailable"}`}>
      <div className="team-zone-content">
        {side === "away" ? <Logo team={team} theme={theme} /> : null}
        <div className="team-copy">
          <p className="team-city">{city || team.name}</p>
          <h1 className="team-nickname" style={{ color: theme.accent }}>{nickname}</h1>
          <p className="team-abbreviation">{team.abbreviation ?? nickname.slice(0, 3).toUpperCase()}</p>
          <p className="team-score">{score ?? "—"}</p>
          {team.record ? <p className="team-record">{team.record}</p> : null}
        </div>
        {side === "home" ? <Logo team={team} theme={theme} /> : null}
      </div>
    </section>
  );
}

function Logo({ team, theme }: { team: TeamDisplay; theme: ReturnType<typeof resolveMlbGameTeamTheme> }) {
  return theme.logo ? (
    <img className="team-logo" src={theme.logo} alt="" draggable={false} />
  ) : (
    <span className="team-logo-fallback" style={{ color: theme.accent }}>{team.abbreviation ?? team.name.slice(0, 3)}</span>
  );
}

function GameState({ live, event }: { live?: BaseballLiveData; event: SportsEvent }) {
  return (
    <section className="game-center-zone" aria-label="Current game situation">
      <h2 className="inning-heading">{inningLabel(live, event)}</h2>
      <div className="situation-row">
        <div className="situation-item"><p>OUTS</p><Outs value={live?.count?.outs} /></div>
        <div className="situation-item"><p>COUNT</p><strong>{live?.count?.balls !== undefined || live?.count?.strikes !== undefined ? `${live.count?.balls ?? "—"}-${live.count?.strikes ?? "—"}` : "—"}</strong></div>
        <div className="situation-item"><p>ON BASE</p><BaseDiamond bases={live?.bases} /></div>
      </div>
    </section>
  );
}

function Outs({ value }: { value?: number }) {
  return <div className="outs-dots" aria-label={value === undefined ? "Outs unavailable" : `${value} outs`}>{[0, 1, 2].map((out) => <span key={out} className={value !== undefined && out < value ? "is-out" : ""} />)}</div>;
}

function BaseDiamond({ bases }: { bases?: BaseballBases }) {
  return <div className="base-diamond" role="img" aria-label={`Bases occupied: ${bases?.second ? "second " : ""}${bases?.third ? "third " : ""}${bases?.first ? "first" : "none"}`}><span className={bases?.second ? "occupied" : ""} /><span className={bases?.third ? "occupied" : ""} /><span className={bases?.first ? "occupied" : ""} /></div>;
}

function MatchupZone({ batter, pitcher, pitcherEra }: { batter?: BaseballPlayerRef; pitcher?: BaseballPlayerRef; pitcherEra?: string }) {
  if (!batter && !pitcher) return null;
  return <section className="matchup-zone"><PlayerMatchup label="AT BAT" player={batter} /><span className="matchup-vs"><span>VS</span></span><PlayerMatchup label="PITCHING" player={pitcher} extra={pitcherEra ? `ERA ${pitcherEra}` : undefined} /></section>;
}

function PlayerMatchup({ label, player, extra }: { label: string; player?: BaseballPlayerRef; extra?: string }) {
  return <div className="player-matchup"><p className="matchup-label">{label}</p>{player ? <><p className="player-first">{playerFirstName(player)}</p><p className="player-last">{playerLastName(player)}</p><p className="player-meta">{player.position ?? ""}{extra ? ` · ${extra}` : ""}</p></> : <p className="player-unavailable">Unavailable</p>}</div>;
}

function LastPlayZone({ description }: { description?: string }) {
  if (!description) return null;
  return <section className="last-play-zone"><p>LAST PLAY</p><span>{description}</span></section>;
}

function LineScoreZone({ live, away, home }: { live?: BaseballLiveData; away: TeamDisplay; home: TeamDisplay }) {
  const innings = live?.linescore?.innings ?? [];
  if (!live || !innings.length) return null;
  return <section className="linescore-zone"><h2>RUNS BY INNING</h2><div className="linescore-table" style={{ "--inning-count": innings.length } as CSSProperties}><div /><div className="linescore-numbers">{innings.map((inning) => <span key={inning.inning}>{inning.inning}</span>)}<span>R</span><span>H</span><span>E</span></div><strong>{away.abbreviation ?? away.name.slice(0, 3)}</strong><div className="linescore-numbers">{innings.map((inning) => <span key={inning.inning}>{inning.away?.runs ?? "—"}</span>)}<span>{live.away.score}</span><span>{live.away.hits ?? "—"}</span><span>{live.away.errors ?? "—"}</span></div><strong>{home.abbreviation ?? home.name.slice(0, 3)}</strong><div className="linescore-numbers">{innings.map((inning) => <span key={inning.inning}>{inning.home?.runs ?? "—"}</span>)}<span>{live.home.score}</span><span>{live.home.hits ?? "—"}</span><span>{live.home.errors ?? "—"}</span></div></div></section>;
}

function GameStatsZone({ live }: { live?: BaseballLiveData }) {
  if (!live || (live.away.hits === undefined && live.home.hits === undefined && live.away.errors === undefined && live.home.errors === undefined)) return null;
  return <section className="stats-zone"><StatCell label="HITS" value={`${live.away.hits ?? "—"} · ${live.home.hits ?? "—"}`} /><StatCell label="ERRORS" value={`${live.away.errors ?? "—"} · ${live.home.errors ?? "—"}`} /></section>;
}

function StatCell({ label, value }: { label: string; value: string }) { return <div className="stat-cell"><p>{label}</p><strong>{value}</strong></div>; }

function PitchInfoZone({ pitch, pitchCount }: { pitch?: BaseballLiveData["latestPitch"]; pitchCount?: number }) {
  if (!pitch && pitchCount === undefined) return null;
  const pitchType = pitch?.typeName ?? pitch?.description ?? "";
  return <section className="pitch-zone"><h2>PITCH INFO</h2><div><p>LAST PITCH</p><strong>{pitch?.velocityMph !== undefined ? `${pitch.velocityMph} MPH` : ""}</strong><span className="pitch-type-desktop">{pitchType}</span></div><div className="pitch-type-compact"><p>PITCH TYPE</p><strong>{pitchType}</strong></div><div><p>PITCH COUNT</p><strong>{pitchCount ?? ""}</strong></div></section>;
}

function BroadcastFooter({ event, live }: { event: SportsEvent; live?: BaseballLiveData }) {
  const weather = live?.weather?.temperatureF !== undefined ? `${live.weather.temperatureF}°F${live.weather.condition ? ` · ${live.weather.condition}` : ""}` : "";
  return <footer className="broadcast-footer"><span>{event.start.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span><span>{live?.venue?.name ?? event.venue ?? ""}{live?.venue?.city ? ` · ${live.venue.city}` : ""}</span><span>{weather}</span></footer>;
}
