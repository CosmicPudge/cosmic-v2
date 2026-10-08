"use client";

import { useSchoolData } from "@/components/school/hooks/useSchoolData";
import { getCurrentAndNextClass } from "@/components/school/data/weeklySchedule";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";

export default function SchoolCalendarKioskWidget() {
  const { presentation } = useWidgetContext();
  const { data, local, loading, error } = useSchoolData({ enabled: presentation !== "kiosk" });
  const term = local.data.terms.find((item) => item.active) ?? local.data.terms[0];
  const courses = local.data.courses.filter((course) => !term || course.termId === term.id);
  const schedule = getCurrentAndNextClass(courses, term);
  const now = new Date();
  const providerNext = data?.classes.filter((item) => item.start > now).sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  const next = schedule.currentClass ?? schedule.nextClass;
  const title = loading && !next && !providerNext ? "Checking school calendar." : next?.course.name ?? providerNext?.name ?? "No upcoming classes.";
  const start = next?.start ?? providerNext?.start;
  const location = next?.location ?? providerNext?.location;
  const subtitle = start ? `${start.toLocaleDateString([], { weekday: "long" })} · ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : error ? "School calendar temporarily unavailable" : "Academic schedule is clear";

  return <KioskSceneFrame scene="school" backgroundState={start ? "upcoming" : "clear"} eyebrow="COSMOS • SCHOOL CALENDAR" title={title} subtitle={subtitle}><div className="kiosk-native-scene-details">{location ? <span>{location}</span> : null}{term ? <span>{term.name}</span> : null}</div></KioskSceneFrame>;
}
