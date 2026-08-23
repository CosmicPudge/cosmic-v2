"use client";

import { useEffect, useState } from "react";
import { useSettingsRepository } from "@/services/settings/localRepository";
import { setActiveCosmicScope, useCosmicScope } from "@/services/storage/scope";

const profiles = ["neutral", "reference", "sports-heavy", "student", "minimal"] as const;

export default function PreferencesInspector() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const settings = useSettingsRepository();
  const scope = useCosmicScope();
  if (!mounted) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">
          Cosmic Preferences Inspector
        </h1>

        <p className="mt-4 text-sm text-white/50">
          Reading preference state…
        </p>
      </main>
    );
  }
  return <main className="mx-auto min-h-screen max-w-5xl space-y-6 p-6 text-white"><div><p className="text-xs uppercase tracking-[0.2em] text-white/45">Developer tools</p><h1 className="mt-2 text-3xl font-semibold">Preferences and scope inspector</h1><p className="mt-2 text-white/55">Local profile and data-scope simulation for future multi-user personalization. No authentication or cloud sync is involved.</p></div><section><h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/45">Data scope</h2><div className="flex flex-wrap gap-2">{["local", "scope-a", "scope-b"].map((id) => <button key={id} type="button" onClick={() => setActiveCosmicScope(id)} className={`rounded-xl border px-3 py-2 text-sm ${scope.id === id ? "border-cyan-200/35 bg-cyan-200/10" : "border-white/10 bg-white/5"}`}>{id === "local" ? "Local reference" : id.replace("scope-", "Scope ").toUpperCase()}</button>)}</div><p className="mt-2 text-xs text-white/40">Active scope: {scope.id}. Repositories reload this scope reactively; legacy local data migrates only into the local scope.</p></section><section><h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/45">Preference profile</h2><div className="flex flex-wrap gap-2">{profiles.map((profile) => <button key={profile} type="button" onClick={() => settings.setProfile(profile)} className={`rounded-xl border px-3 py-2 text-sm capitalize ${settings.data.profileId === profile ? "border-cyan-200/35 bg-cyan-200/10" : "border-white/10 bg-white/5"}`}>{profile.replace("-", " ")}</button>)}</div></section><section className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">Active profile</h2><p className="mt-2 text-white/65">{settings.data.profileId}</p><p className="mt-1 text-sm text-white/45">Storage scope: {scope.id}</p></article><article className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">Sports follows</h2><ul className="mt-2 space-y-1 text-sm text-white/65">{settings.data.preferences.sports.followedTeams.map((team) => <li key={`${team.provider}:${team.teamId}`}>{team.label} · {team.sport}</li>)}{!settings.data.preferences.sports.followedTeams.length && <li>No followed teams; enabled sports remain discoverable.</li>}</ul></article><article className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">Modules</h2><pre className="mt-2 overflow-auto text-xs text-white/55">{JSON.stringify(settings.data.preferences.modules, null, 2)}</pre></article><article className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">Dashboard preferences</h2><pre className="mt-2 overflow-auto text-xs text-white/55">{JSON.stringify(settings.data.preferences.dashboard, null, 2)}</pre></article></section></main>;
}
