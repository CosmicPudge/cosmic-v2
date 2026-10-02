"use client";

import KioskSceneBackground from "../shared/KioskSceneBackground";
import KioskSceneIdentity from "../shared/KioskSceneIdentity";

type Assignment = { id: string; title: string; due: string; course?: string; completed: boolean };

export default function KioskSchoolScene({ school }: { school: { assignments: Assignment[]; nextAssignment?: Assignment; dueToday: Assignment[]; dueThisWeek: Assignment[]; connected: boolean; error?: string; sceneState: string } }) {
  const next = school.nextAssignment;
  return <section className="kiosk-native-scene kiosk-native-scene-school" data-kiosk-native-scene="school">
    <KioskSceneBackground family="school" state={school.sceneState} />
    <KioskSceneIdentity sceneLabel="COSMIC • SCHOOL" />
    <div className="kiosk-time-scene-main">
      <header className="kiosk-time-scene-heading"><div><p className="kiosk-time-scene-kicker">SCHOOL</p><p className="kiosk-time-scene-date">Academic workload</p></div>{school.error ? <p className="kiosk-time-scene-status">Updating</p> : null}</header>
      <div className="kiosk-time-scene-grid">
        <section className="kiosk-time-scene-hero" aria-label="Up next">
          <p className="kiosk-time-scene-label">Up next</p>
          {next ? <><p className="kiosk-time-scene-hero-title">{next.title}</p><p className="kiosk-time-scene-hero-meta">{next.course ?? "School assignment"}</p><p className="kiosk-time-scene-hero-due">Due {formatDue(next.due)}</p></> : <p className="kiosk-time-scene-empty">{school.connected ? "No upcoming assignments" : school.error ?? "School data unavailable"}</p>}
        </section>
        <div className="kiosk-time-scene-lists">
          <KioskAssignmentList label="Due today" items={school.dueToday} empty="Nothing due today" />
          <KioskAssignmentList label="Due this week" items={school.dueThisWeek} empty="No more work this week" />
        </div>
      </div>
    </div>
  </section>;
}

function KioskAssignmentList({ label, items, empty }: { label: string; items: Assignment[]; empty: string }) {
  return <section className="kiosk-time-scene-list" aria-label={label}><p className="kiosk-time-scene-label">{label}</p>{items.length ? <div className="kiosk-time-scene-rows">{items.slice(0, 5).map((item) => <div className="kiosk-time-scene-row" key={item.id}><div className="min-w-0"><p className="kiosk-time-scene-row-title">{item.title}</p><p className="kiosk-time-scene-row-meta">{item.course ?? "School assignment"}</p></div><span className="kiosk-time-scene-row-time">{formatDue(item.due)}</span></div>)}</div> : <p className="kiosk-time-scene-muted">{empty}</p>}</section>;
}

function formatDue(value: string) {
  return new Date(value).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
