"use client";

import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";

export default function SchoolCalendarKioskWidget() {
  const kiosk = useDeveloperKioskData();
  const now = new Date();
  const next = kiosk.data?.school.classes
    .filter((item) => new Date(item.end) >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  const start = next ? new Date(next.start) : null;

  return <KioskSceneFrame
    scene="school"
    backgroundState={next ? "upcoming" : kiosk.data?.school.connected ? "clear" : "unavailable"}
    eyebrow="COSMOS • SCHOOL CALENDAR"
    title={kiosk.loading ? "Checking school calendar." : next?.name ?? (kiosk.data?.school.connected ? "No upcoming classes." : "School calendar unavailable.")}
    subtitle={start ? `${start.toLocaleDateString([], { weekday: "long" })} · ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : kiosk.data?.school.error ?? "Academic schedule is clear"}
  >
    <div className="kiosk-native-scene-details">
      {next?.location ? <span>{next.location}</span> : null}
      {next?.instructor ? <span>{next.instructor}</span> : null}
    </div>
  </KioskSceneFrame>;
}
