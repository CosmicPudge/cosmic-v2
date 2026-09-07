"use client";

import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import type { SettingsRepository } from "@/services/settings/localRepository";
import { f1Constructors, f1Drivers, nascarDrivers, sportsDirectoryBySport, type SportsDirectoryEntry } from "@/services/sports/directory";
import SportsEntitySelector from "./SportsEntitySelector";
import { prefetchCollegeFootballSchedule, useCollegeFootballDirectory } from "@/hooks/os/useCollegeFootballDirectory";
import PushDeliverySettings from "./PushDeliverySettings";

const teamSports = ["nfl", "mlb", "college-football", "nba", "mls"] as const;
type TeamSport = (typeof teamSports)[number];

const labels: Record<TeamSport, string> = { nfl: "NFL", mlb: "MLB", "college-football": "College Football", nba: "NBA", mls: "MLS" };

export default function SportsPreferencesPanel({ settings }: { settings: SettingsRepository }) {
  const collegeFootball = useCollegeFootballDirectory();
  const preferences = settings.data.preferences;
  const sports = preferences.sports;
  const updateSports = (next: CosmicUserPreferences["sports"]) => settings.setPreferences({ ...preferences, sports: next });
  const toggleNotification = (key: keyof CosmicUserPreferences["sports"]["notifications"]) => updateSports({ ...sports, notifications: { ...sports.notifications, [key]: !sports.notifications[key] } });
  const toggleSport = (sport: CosmicUserPreferences["sports"]["enabledSports"][number]) => updateSports({ ...sports, enabledSports: sports.enabledSports.includes(sport) ? sports.enabledSports.filter((item) => item !== sport) : [...sports.enabledSports, sport] });
  const teamKey = (entry: SportsDirectoryEntry) => entry.providerId ?? entry.id;
  const selectedTeams = (sport: TeamSport) => sports.followedTeams.filter((team) => team.sport === sport).map((team) => team.teamId);
  const toggleTeam = (entry: SportsDirectoryEntry) => {
    const id = teamKey(entry);
    const exists = sports.followedTeams.some((item) => item.sport === entry.sport && item.teamId === id);
    updateSports({ ...sports, followedTeams: exists ? sports.followedTeams.filter((item) => !(item.sport === entry.sport && item.teamId === id)) : [...sports.followedTeams, { sport: entry.sport as TeamSport, provider: entry.provider ?? "pending", teamId: id, label: entry.name, ...(entry.nickname ? { nickname: entry.nickname } : {}), ...(entry.abbreviation ? { abbreviation: entry.abbreviation } : {}), ...(entry.conference ? { conference: entry.conference } : {}), ...(entry.subdivision ? { subdivision: entry.subdivision } : {}), ...(entry.logoUrl ? { logoUrl: entry.logoUrl } : {}) }] });
    if (!exists && entry.sport === "college-football") prefetchCollegeFootballSchedule(id);
  };
  const toggleDriver = (entry: SportsDirectoryEntry) => {
    const exists = sports.followedDrivers.some((item) => item.id === entry.id);
    updateSports({ ...sports, followedDrivers: exists ? sports.followedDrivers.filter((item) => item.id !== entry.id) : [...sports.followedDrivers, { id: entry.id, label: entry.name, sport: entry.sport as "f1" | "nascar" }] });
  };
  const toggleConstructor = (entry: SportsDirectoryEntry) => {
    const exists = sports.followedConstructors.some((item) => item.id === entry.id);
    updateSports({ ...sports, followedConstructors: exists ? sports.followedConstructors.filter((item) => item.id !== entry.id) : [...sports.followedConstructors, { id: entry.id, label: entry.name, sport: "f1" }] });
  };

  return <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-lg font-bold">Sports & Teams</h3><p className="mt-1 text-sm text-white/45">Follow teams, drivers, and constructors for this account.</p></div><span className="text-xs text-white/35">Selections save automatically</span></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      {teamSports.map((sport) => { const entries = sport === "college-football" ? collegeFootball.teams : sportsDirectoryBySport(sport); const enabled = sports.enabledSports.includes(sport); const groups = sport === "college-football" ? [{ label: "FBS", entries: entries.filter((entry) => entry.subdivision === "FBS") }, { label: "FCS", entries: entries.filter((entry) => entry.subdivision === "FCS") }, { label: "Other active teams", entries: entries.filter((entry) => entry.subdivision !== "FBS" && entry.subdivision !== "FCS") }] : undefined; return <article key={sport} className="rounded-xl border border-white/10 bg-black/10 p-3.5"><div className="mb-3 flex items-center justify-between"><div><h4 className="font-semibold">{labels[sport]}</h4><p className="text-xs text-white/35">{sport === "college-football" ? "Complete ESPN directory · active FBS, FCS, and other teams" : sport === "nba" || sport === "mls" ? "Provider feed pending" : "Live team feed"}</p></div><button type="button" aria-pressed={enabled} onClick={() => toggleSport(sport)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${enabled ? "border-cyan-200/35 bg-cyan-200/10 text-cyan-100" : "border-white/10 text-white/45"}`}>{enabled ? "Enabled" : "Disabled"}</button></div><SportsEntitySelector label={`${labels[sport]} teams`} placeholder="Search teams" entries={entries} groups={groups} selectedIds={selectedTeams(sport)} onToggle={toggleTeam} onClear={() => updateSports({ ...sports, followedTeams: sports.followedTeams.filter((item) => item.sport !== sport) })} loading={sport === "college-football" && collegeFootball.loading} unavailableMessage={sport === "college-football" ? (collegeFootball.error ?? "No provider teams match your search.") : undefined} /></article>; })}
    </div>
    <PushDeliverySettings /><div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-3.5"><div className="mb-3"><h4 className="font-semibold">Sports notifications</h4><p className="mt-1 text-xs text-white/35">Account-owned preferences. These categories control eligible Sports signals and push delivery.</p></div><div className="grid gap-2 sm:grid-cols-2">{([{ key: "gameStartingSoon", label: "Game starting soon" }, { key: "gameStarted", label: "Game started" }, { key: "scoreChange", label: "Score changes" }, { key: "closeGameLate", label: "Close-game alerts" }, { key: "finalResult", label: "Final results" }, { key: "delayPostponement", label: "Delays / postponements" }, { key: "qualifyingStartingSoon", label: "F1 qualifying soon" }, { key: "qualifyingResult", label: "F1 qualifying results" }, { key: "raceStartingSoon", label: "Race starting soon" }, { key: "raceResult", label: "F1 race results" }, { key: "nascarResult", label: "NASCAR results" }, { key: "followedResult", label: "Favorite driver results" }] as const).map((item) => <label key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] px-3 py-2.5 text-sm text-white/65"><span>{item.label}</span><input type="checkbox" checked={sports.notifications[item.key] ?? true} onChange={() => toggleNotification(item.key)} className="size-4 accent-cyan-300" /></label>)}</div></div>
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <article className="rounded-xl border border-white/10 bg-black/10 p-3.5"><div className="mb-3 flex items-center justify-between"><h4 className="font-semibold">Formula 1</h4><button type="button" aria-pressed={sports.enabledSports.includes("f1")} onClick={() => toggleSport("f1")} className={`rounded-full border px-2.5 py-1 text-[11px] ${sports.enabledSports.includes("f1") ? "border-cyan-200/35 bg-cyan-200/10 text-cyan-100" : "border-white/10 text-white/45"}`}>{sports.enabledSports.includes("f1") ? "Enabled" : "Disabled"}</button></div><SportsEntitySelector label="F1 favorites" placeholder="Select drivers & constructors" summary={sports.followedDrivers.some((item) => item.sport === "f1" || item.sport === undefined) || sports.followedConstructors.length ? `${sports.followedDrivers.filter((item) => item.sport === "f1" || item.sport === undefined).length} drivers · ${sports.followedConstructors.length} constructors` : "Select drivers & constructors"} groups={[{ label: "Drivers", entries: f1Drivers }, { label: "Constructors", entries: f1Constructors }]} selectedIds={[...sports.followedDrivers.filter((item) => item.sport === "f1" || item.sport === undefined).map((item) => item.id), ...sports.followedConstructors.map((item) => item.id)]} onToggle={(entry) => entry.sport === "f1" && f1Drivers.some((driver) => driver.id === entry.id) ? toggleDriver(entry) : toggleConstructor(entry)} onClear={() => updateSports({ ...sports, followedDrivers: sports.followedDrivers.filter((item) => item.sport !== "f1" && item.sport !== undefined), followedConstructors: [] })} /></article>
      <article className="rounded-xl border border-white/10 bg-black/10 p-3.5 md:col-span-2"><div className="mb-3 flex items-center justify-between"><div><h4 className="font-semibold">NASCAR</h4><p className="text-xs text-white/35">Driver preferences ready for the feed</p></div><button type="button" aria-pressed={sports.enabledSports.includes("nascar")} onClick={() => toggleSport("nascar")} className={`rounded-full border px-2.5 py-1 text-[11px] ${sports.enabledSports.includes("nascar") ? "border-cyan-200/35 bg-cyan-200/10 text-cyan-100" : "border-white/10 text-white/45"}`}>{sports.enabledSports.includes("nascar") ? "Enabled" : "Disabled"}</button></div><div className="max-w-xl"><SportsEntitySelector label="NASCAR drivers" placeholder="Select drivers" entries={nascarDrivers} selectedIds={sports.followedDrivers.filter((item) => item.sport === "nascar").map((item) => item.id)} onToggle={toggleDriver} onClear={() => updateSports({ ...sports, followedDrivers: sports.followedDrivers.filter((item) => item.sport !== "nascar") })} /></div></article>
    </div>
  </section>;
}
