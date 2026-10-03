"use client";

import KioskSceneBackground from "../shared/KioskSceneBackground";
import KioskSceneIdentity from "../shared/KioskSceneIdentity";
import { formatKioskSchoolDue } from "@/services/kiosk/timeBuckets";
import { formatKioskSchoolAssignment } from "@/services/kiosk/presentation";
import KioskConnectionStatus from "../shared/KioskConnectionStatus";

type Assignment = { id: string; title: string; due: string; course?: string; completed: boolean };

export default function KioskSchoolScene({ school }: { school: { assignments: Assignment[]; nextAssignment?: Assignment; dueToday: Assignment[]; dueThisWeek: Assignment[]; connected: boolean; error?: string; sceneState: string } }) {
  const next = school.nextAssignment;
  return <section className="kiosk-native-scene kiosk-native-scene-school" data-kiosk-native-scene="school">
    <KioskSceneBackground family="school" state={school.sceneState} />
    <KioskSceneIdentity sceneLabel="COSMIC • SCHOOL" />
    <div className="kiosk-time-scene">
      <header className="kiosk-time-scene-heading"><div><p className="kiosk-time-scene-date">Academic workload</p><KioskConnectionStatus service="school" /></div>{school.error ? <p className="kiosk-time-scene-status">Updating</p> : null}</header>
      <div className="kiosk-time-scene-grid">
        <section className="kiosk-time-scene-hero" aria-label="Up next">
          <p className="kiosk-time-scene-label">Up next</p>
          {next ? <><p className="kiosk-time-scene-hero-title">{formatKioskSchoolAssignment(next.title, next.course).title}</p><p className="kiosk-time-scene-hero-meta">{formatKioskSchoolAssignment(next.title, next.course).course ?? "School assignment"}</p><p className="kiosk-time-scene-hero-due">Due {formatDue(next.due)}</p></> : <div className="kiosk-time-scene-empty">{school.connected ? <><p>You&apos;re caught up.</p><p className="kiosk-time-scene-muted">No upcoming assignments in the next 14 days.</p></> : <p>{school.error ?? "School data unavailable"}</p>}</div>}
        </section>
        <div className="kiosk-time-scene-lists">
          <KioskAssignmentList label="Due today" items={school.dueToday} excludeId={next?.id} empty="Nothing due today" />
          <KioskAssignmentList label="Due this week" items={school.dueThisWeek} excludeId={next?.id} empty="No more work this week" />
        </div>
      </div>
    </div>
  </section>;
}

function KioskAssignmentList({ label, items, excludeId, empty }: { label: string; items: Assignment[]; excludeId?: string; empty: string }) {
  const visibleItems = items.filter((item) => item.id !== excludeId);
  return <section className="kiosk-time-scene-list" aria-label={label}><p className="kiosk-time-scene-label">{label}</p>{visibleItems.length ? <div className="kiosk-time-scene-rows">{visibleItems.slice(0, 5).map((item) => { const display = formatKioskSchoolAssignment(item.title, item.course); return <div className="kiosk-time-scene-row" key={item.id}><div className="min-w-0"><p className="kiosk-time-scene-row-title">{display.title}</p><p className="kiosk-time-scene-row-meta">{display.course ?? "School assignment"}</p></div><span className="kiosk-time-scene-row-time">{formatDue(item.due)}</span></div>; })}</div> : <p className="kiosk-time-scene-muted">{empty}</p>}</section>;
}

function formatDue(value: string) { return formatKioskSchoolDue(value); }
