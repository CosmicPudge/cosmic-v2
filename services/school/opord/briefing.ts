import type { OpordEvent } from "./types";
import { nextActiveAfrotcEvent, selectCurrentOpord, type OpordSource } from "./selectors";
import { pfraSummary, resolvedUniform } from "./selectors";

export type AfrotcBriefingMoment = "today" | "tomorrow" | "next";
export interface AfrotcBriefingEvent {
  source: OpordSource;
  event: OpordEvent;
  moment: AfrotcBriefingMoment;
  uniform: string | null;
  location: string | null;
  bring: string[];
  workoutTitle: string | null;
  workoutSummary: string[];
  pfraFocus: string[];
}
export interface AfrotcBriefing { status: "today" | "tomorrow" | "next" | "none"; currentSource?: OpordSource; event?: AfrotcBriefingEvent; todayEvent?: AfrotcBriefingEvent; tomorrowEvent?: AfrotcBriefingEvent; nextEvent?: AfrotcBriefingEvent; }

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const nextLocalDate = (date: Date) => { const next = new Date(date); next.setDate(next.getDate() + 1); return localDate(next); };
const fieldValue = (field: OpordEvent["date"] | OpordEvent["formUpLocation"]) => field.status === "explicit" ? field.value : null;

function briefingEvent(source: OpordSource, event: OpordEvent, moment: AfrotcBriefingMoment, category?: string): AfrotcBriefingEvent {
  const workout = event.workouts[0];
  const workoutSummary = workout?.blocks.flatMap((block) => [...block.exercises.map((item) => item.name), ...block.running.map((item) => item.name)]).filter((value, index, values) => values.indexOf(value) === index) ?? [];
  return { source, event, moment, uniform: resolvedUniform(event, category), location: fieldValue(event.formUpLocation), bring: event.bring, workoutTitle: workout?.title ?? null, workoutSummary, pfraFocus: pfraSummary(event) };
}

export function getAfrotcBriefing(sources: OpordSource[], category?: string, now = new Date()): AfrotcBriefing {
  const today = localDate(now); const tomorrow = nextLocalDate(now); const currentSource = selectCurrentOpord(sources, today);
  if (!currentSource) return { status: "none" };
  const events = currentSource.document.events.filter((event) => event.status !== "cancelled" && event.date.status === "explicit");
  const todayEvent = events.find((event) => event.date.status === "explicit" && event.date.value === today);
  const tomorrowEvent = events.find((event) => event.date.status === "explicit" && event.date.value === tomorrow);
  const nextRef = nextActiveAfrotcEvent([currentSource], today);
  const nextEvent = nextRef && nextRef.event.date.status === "explicit" && nextRef.event.date.value !== today && nextRef.event.date.value !== tomorrow ? nextRef.event : undefined;
  const make = (event: OpordEvent | undefined, moment: AfrotcBriefingMoment) => event ? briefingEvent(currentSource, event, moment, category) : undefined;
  const todayBrief = make(todayEvent, "today"); const tomorrowBrief = make(tomorrowEvent, "tomorrow"); const nextBrief = make(nextEvent, "next");
  return todayBrief ? { status: "today", currentSource, event: todayBrief, todayEvent: todayBrief, ...(tomorrowBrief ? { tomorrowEvent: tomorrowBrief } : {}), ...(nextBrief ? { nextEvent: nextBrief } : {}) } : tomorrowBrief ? { status: "tomorrow", currentSource, event: tomorrowBrief, ...(nextBrief ? { nextEvent: nextBrief } : {}), tomorrowEvent: tomorrowBrief } : nextBrief ? { status: "next", currentSource, event: nextBrief, nextEvent: nextBrief } : { status: "none", currentSource };
}
