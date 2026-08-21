import type { CalendarSnapshot } from "@/core/contracts/Calendar";
import type { ClockLocalData } from "@/core/contracts/Clock";
import type { CosmicContextItem } from "@/core/contracts/Context";
import type { FinanceSnapshot } from "@/core/contracts/Finance";
import type { MusicSnapshot } from "@/core/contracts/Music";
import type { SportsSnapshot } from "@/core/contracts/Sports";
import type { LocalSchoolData } from "@/components/school/data/localRepository";
import { getCurrentAndNextClass } from "@/components/school/data/weeklySchedule";
import { getTimerRemaining } from "@/services/clock/time";
import { getUpcomingRecurringItems } from "@/services/finance/domain";
import { getRelevantTimedEvent } from "@/services/calendar/relevance";

const iso = (value: Date | number) => new Date(value).toISOString();
const minutesFromNow = (value: Date, now: Date) => Math.round((value.getTime() - now.getTime()) / 60_000);

export function calendarContext(snapshot: CalendarSnapshot | null, now: Date): CosmicContextItem[] {
  if (!snapshot) return [];
  const relevant = getRelevantTimedEvent([...snapshot.today, ...snapshot.upcoming], now);
  if (!relevant.event) return [];
  const event = relevant.event;
  const current = relevant.current;
  return [{
    id: `calendar:${event.id}`,
    priority: current ? "attention" : minutesFromNow(event.start, now) <= 30 ? "attention" : "glance",
    source: "calendar",
    kind: current ? "current-event" : "next-event",
    title: current ? event.title : `Next: ${event.title}`,
    subtitle: current ? "Happening now" : `${event.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${event.location ? ` · ${event.location}` : ""}`,
    timestamp: iso(now),
    startsAt: iso(event.start),
    expiresAt: iso(event.end),
    destination: "/calendar",
    metadata: { minutesAway: Math.max(0, minutesFromNow(event.start, now)) },
  }];
}

export function schoolContext(data: LocalSchoolData, now: Date): CosmicContextItem[] {
  const term = data.terms.find((item) => item.active) ?? data.terms[0];
  const schedule = getCurrentAndNextClass(data.courses.filter((course) => !term || course.termId === term.id), term, now);
  const result: CosmicContextItem[] = [];
  const classItem = schedule.currentClass ?? schedule.nextClass;
  if (classItem) {
    result.push({ id: `school:class:${classItem.course.id}:${classItem.start.toISOString()}`, priority: schedule.currentClass ? "attention" : minutesFromNow(classItem.start, now) <= 30 ? "attention" : "glance", source: "school", kind: schedule.currentClass ? "current-class" : "next-class", title: classItem.course.code ?? classItem.course.name, subtitle: schedule.currentClass ? "Class in progress" : `${classItem.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${classItem.location ? ` · ${classItem.location}` : ""}`, timestamp: iso(now), startsAt: iso(classItem.start), expiresAt: iso(classItem.end), destination: "/school" });
  }
  const assignment = data.assignments.filter((item) => item.status !== "completed" && item.dueAt).sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity))[0];
  if (assignment?.dueAt) result.push({ id: `school:assignment:${assignment.id}`, priority: assignment.priority === "high" || assignment.dueAt.getTime() - now.getTime() < 24 * 60 * 60_000 ? "attention" : "glance", source: "school", kind: "assignment", title: assignment.title, subtitle: `Due ${assignment.dueAt.toLocaleDateString([], { month: "short", day: "numeric" })}`, timestamp: iso(now), startsAt: iso(assignment.dueAt), destination: "/school" });
  return result;
}

export function sportsContext(snapshot: SportsSnapshot | null, now: Date): CosmicContextItem[] {
  if (!snapshot) return [];
  return [...snapshot.live, ...snapshot.upcoming].slice(0, 4).map((event) => ({ id: `sports:${event.id}`, priority: event.status === "live" || event.status === "delayed" ? "attention" : "glance", source: "sports", kind: event.status === "live" ? "live-event" : "upcoming-event", title: event.title, subtitle: event.status === "live" ? "Live now" : event.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), timestamp: iso(now), startsAt: iso(event.start), destination: `/sports/event/${encodeURIComponent(event.id)}` }));
}

export function financeContext(snapshot: FinanceSnapshot, now: Date): CosmicContextItem[] {
  return getUpcomingRecurringItems(snapshot.recurringItems, now, 7).slice(0, 2).map((item) => ({ id: `finance:recurring:${item.id}`, priority: item.direction === "expense" ? "attention" : "glance", source: "finance", kind: "expected-transaction", title: item.name, subtitle: `Expected ${new Date(item.nextExpectedDate).toLocaleDateString([], { month: "short", day: "numeric" })}`, timestamp: iso(now), startsAt: item.nextExpectedDate, destination: "/finance", metadata: { balancesHidden: snapshot.hideBalances } }));
}

export function garageContext(selectedVehicle: { id: string; nickname: string } | undefined, summary: { maintenance: Array<{ id: string; name: string }>; statusById: Map<string, string> } | null, now: Date): CosmicContextItem[] {
  if (!selectedVehicle || !summary) return [];
  const overdue = summary.maintenance.find((item) => summary.statusById.get(item.id) === "overdue");
  return overdue ? [{ id: `garage:${overdue.id}`, priority: "attention", source: "garage", kind: "maintenance", title: overdue.name, subtitle: `${selectedVehicle.nickname} needs attention`, timestamp: iso(now), destination: "/garage" }] : [];
}

export function clockContext(data: ClockLocalData, now: Date): CosmicContextItem[] {
  return data.timers.filter((timer) => timer.status === "running" && timer.targetEndAt).map((timer) => ({ id: `clock:timer:${timer.id}`, priority: getTimerRemaining(timer, now.getTime()) <= 60_000 ? "critical" : "attention", source: "clock", kind: "timer", title: timer.label, subtitle: `${Math.max(0, Math.ceil(getTimerRemaining(timer, now.getTime()) / 60_000))} min remaining`, timestamp: iso(now), expiresAt: iso(timer.targetEndAt!), destination: "/clock" }));
}

export function musicContext(snapshot: MusicSnapshot | null, now: Date): CosmicContextItem[] {
  const track = snapshot?.connected && snapshot.playback.playing ? snapshot.playback.track : undefined;
  return track ? [{ id: `music:${track.id}`, priority: "passive", source: "music", kind: "now-playing", title: track.title, subtitle: track.artists.join(", "), timestamp: iso(now), destination: "/music" }] : [];
}

export function mailContext(unreadCount: number, now: Date): CosmicContextItem[] {
  return unreadCount > 0 ? [{ id: "mail:unread", priority: "glance", source: "mail", kind: "unread", title: `${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`, subtitle: "Inbox", timestamp: iso(now), destination: "/gmail", metadata: { unreadCount } }] : [];
}
