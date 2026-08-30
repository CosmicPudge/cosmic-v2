"use client";

import { apps } from "@/config/apps";
import type {
  SearchProvider,
  SearchProviderRecord,
  SearchQuery,
} from "@/core/contracts/Search";
import { readSchoolSnapshot } from "@/components/school/data/localRepository";
import { readClockSnapshot } from "@/services/clock/localRepository";
import { readGarageSnapshot } from "@/services/garage/localRepository";
import { readNotesSnapshot } from "@/services/notes/localRepository";
import { readProjectsSnapshot } from "@/services/projects/localRepository";
import { settingsSections } from "@/config/settings";
import { systemDestinations } from "@/config/system";
import { readFinanceSnapshot } from "@/services/finance/localRepository";
import { allSportsDirectoryEntries } from "@/services/sports/directory";
import { schoolSnapshotSearchRecords } from "@/services/search/schoolAdapter";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function dateValue(value: unknown) {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(text(value));
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function matches(query: SearchQuery, ...values: Array<string | undefined>) {
  const haystack = values.filter(Boolean).join(" ").toLocaleLowerCase();
  return query.tokens.every((token) => haystack.includes(token));
}

function compact(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

function truncate(value: string, limit = 128) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 1).trimEnd()}…` : normalized;
}

function snippet(value: string, query: SearchQuery) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const matchAt = query.tokens
    .map((token) => normalized.toLocaleLowerCase().indexOf(token))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0] ?? 0;
  const start = Math.max(0, matchAt - 34);
  const preview = normalized.slice(start, start + 132).trim();
  return `${start > 0 ? "…" : ""}${preview}${start + 132 < normalized.length ? "…" : ""}`;
}

function formatDate(value: unknown, includeTime = true) {
  const timestamp = dateValue(value);
  if (timestamp === undefined) return undefined;
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric" }).format(timestamp);
}

function bounded(records: SearchProviderRecord[], limit: number) {
  return records.slice(0, Math.max(limit * 5, 40));
}

export function createAppsSearchProvider(schoolEnabled: boolean): SearchProvider {
  return {
  id: "apps",
  categories: ["apps"],
  search(query) {
    return apps
      .filter((app) => app.enabled !== false && (app.id !== "school" || schoolEnabled))
      .filter((app) => matches(query, app.name, app.description, app.route, ...app.keywords))
      .map((app) => ({
        id: app.id,
        category: "apps" as const,
        title: app.name,
        subtitle: app.route,
        description: app.description,
        keywords: app.keywords,
        icon: app.icon,
        href: app.route,
        source: "apps",
      }));
  },
  };
}

export const appsSearchProvider = createAppsSearchProvider(false);

export const settingsSearchProvider: SearchProvider = {
  id: "settings",
  categories: ["settings"],
  search(query) {
    return settingsSections
      .filter((section) => matches(query, section.name, section.description, ...section.keywords))
      .map((section) => ({
        id: section.id,
        category: "settings" as const,
        title: `${section.name} settings`,
        subtitle: "Settings",
        description: section.description,
        keywords: section.keywords,
        icon: section.icon,
        href: section.href,
        source: "settings",
        boost: 10,
      }));
  },
};

export const systemSearchProvider: SearchProvider = {
  id: "system",
  categories: ["system"],
  search(query) {
    return systemDestinations
      .filter((destination) => matches(query, destination.name, destination.description, ...destination.keywords))
      .map((destination) => ({
        id: destination.id,
        category: "system" as const,
        title: destination.name,
        subtitle: "System",
        description: destination.description,
        keywords: [...destination.keywords],
        icon: destination.icon,
        href: destination.href,
        source: "system",
        boost: 12,
      }));
  },
};

export const schoolSearchProvider: SearchProvider = {
  id: "school",
  categories: ["school"],
  async search(query, { limit }) {
    const data = readSchoolSnapshot();
    let normalizedRecords: SearchProviderRecord[] = [];
    let normalizedAssignmentIds = new Set<string>();
    let normalizedCourseIds = new Set<string>();
    try {
      const response = await fetch("/api/school/calendar", { cache: "no-store" });
      if (response.ok) {
        const body = await response.json() as { snapshot?: import("@/services/school/domain").SchoolSnapshot };
        if (body.snapshot) {
          normalizedRecords = schoolSnapshotSearchRecords(body.snapshot, query);
          normalizedAssignmentIds = new Set(body.snapshot.assignments.map((item) => item.id));
          normalizedCourseIds = new Set(body.snapshot.courses.map((item) => item.id));
        }
      }
    } catch { /* Local-only School search remains available. */ }
    const activeTerm = data.terms.find((term) => term.active);
    const activeCourseIds = new Set(data.courses
      .filter((course) => !activeTerm || course.termId === activeTerm.id)
      .map((course) => course.id));
    const courseName = new Map(data.courses.map((course) => [course.id, course.name]));
    const records: SearchProviderRecord[] = [];

    for (const course of data.courses) {
      if (activeTerm && course.termId !== activeTerm.id) continue;
      if (normalizedCourseIds.has(course.id)) continue;
      if (!matches(query, course.name, course.code, course.instructor, course.location)) continue;
      records.push({ id: `course:${course.id}`, category: "school", title: course.name, subtitle: compact([course.code, course.instructor]).join(" · ") || "Course", description: course.location, keywords: ["course", "class"], icon: "🎓", href: "/school/courses", source: "school", boost: 14 });
    }

    for (const assignment of data.assignments) {
      if (assignment.courseId && activeTerm && !activeCourseIds.has(assignment.courseId)) continue;
      if (normalizedAssignmentIds.has(assignment.id)) continue;
      if (!matches(query, assignment.title, assignment.description, assignment.status, assignment.courseId ? courseName.get(assignment.courseId) : undefined)) continue;
      const dueAt = dateValue(assignment.dueAt);
      const overdue = dueAt !== undefined && dueAt < Date.now() && assignment.status !== "completed";
      records.push({ id: `assignment:${assignment.id}`, category: "school", title: assignment.title, subtitle: compact([assignment.courseId ? courseName.get(assignment.courseId) : undefined, formatDate(assignment.dueAt)]).join(" · ") || "Assignment", description: truncate(assignment.description ?? "Assignment"), keywords: ["assignment", assignment.status], icon: "✓", href: "/school/assignments", source: "school", updatedAt: dueAt, boost: overdue ? 34 : assignment.status === "due-soon" ? 24 : 8 });
    }

    for (const goal of data.goals) {
      if (!matches(query, goal.title, goal.target, goal.type)) continue;
      records.push({ id: `goal:${goal.id}`, category: "school", title: goal.title, subtitle: goal.completed ? "Completed goal" : "Academic goal", description: goal.target, keywords: ["goal", goal.type ?? ""], icon: "◎", href: "/school/goals", source: "school", boost: goal.completed ? 0 : 8 });
    }

    for (const resource of data.resources) {
      if (resource.courseId && activeTerm && !activeCourseIds.has(resource.courseId)) continue;
      if (!matches(query, resource.title, resource.category, resource.notes, resource.courseId ? courseName.get(resource.courseId) : undefined)) continue;
      records.push({ id: `resource:${resource.id}`, category: "school", title: resource.title, subtitle: `${resource.category} resource`, description: truncate(resource.notes ?? "School resource"), keywords: ["resource", resource.category], icon: "↗", href: "/school/resources", source: "school" });
    }

    return bounded([...normalizedRecords, ...records].filter((record, index, list) => list.findIndex((candidate) => candidate.id === record.id) === index), limit);
  },
};

export const garageSearchProvider: SearchProvider = {
  id: "garage",
  categories: ["garage"],
  search(query, { limit }) {
    const data = readGarageSnapshot();
    const vehicleName = new Map(data.vehicles.map((vehicle) => [vehicle.id, vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`]));
    const records: SearchProviderRecord[] = [];

    for (const vehicle of data.vehicles) {
      // VIN and license plate are intentionally excluded from both matching and output.
      if (!matches(query, vehicle.nickname, `${vehicle.year}`, vehicle.make, vehicle.model, vehicle.trim, vehicle.status, vehicle.classification, vehicle.unitNumber, vehicle.department, vehicle.locationLabel, vehicle.usageType)) continue;
      records.push({ id: `vehicle:${vehicle.id}`, category: "garage", title: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`, subtitle: compact([vehicle.unitNumber, vehicle.classification, vehicle.status]).join(" · ") || `${vehicle.year} ${vehicle.make} ${vehicle.model}`, description: `${vehicle.currentMileage.toLocaleString()} miles${vehicle.department ? ` · ${vehicle.department}` : ""}${vehicle.locationLabel ? ` · ${vehicle.locationLabel}` : ""}`, keywords: ["vehicle", "car", vehicle.make, vehicle.model, vehicle.unitNumber ?? "", vehicle.department ?? ""], icon: "◆", href: `/garage/vehicle/${encodeURIComponent(vehicle.id)}`, source: "garage", updatedAt: vehicle.updatedAt, boost: vehicle.status === "active" ? 10 : 0 });
    }

    for (const collection of data.collections) {
      if (!matches(query, collection.name, collection.description, collection.kind)) continue;
      records.push({ id: `collection:${collection.id}`, category: "garage", title: collection.name, subtitle: "Garage collection", description: `${data.vehicles.filter((vehicle) => (vehicle.collectionId ?? "my-garage") === collection.id).length} vehicles`, keywords: ["collection", collection.kind], icon: "▦", href: "/garage", source: "garage", updatedAt: collection.updatedAt, boost: 6 });
    }

    const addVehicleRecords = <T extends { id: string; vehicleId: string }>(
      items: T[],
      kind: string,
      titleFor: (item: T) => string,
      detailsFor: (item: T) => string[],
      boostFor: (item: T) => number = () => 0,
    ) => {
      for (const item of items) {
        const vehicle = vehicleName.get(item.vehicleId);
        const details = detailsFor(item);
        const title = titleFor(item);
        if (!matches(query, title, vehicle, ...details)) continue;
        records.push({ id: `${kind}:${item.id}`, category: "garage", title, subtitle: compact([kind, vehicle]).join(" · "), description: truncate(details.join(" · ")), keywords: [kind, "vehicle", "car"], icon: "◇", href: `/garage/vehicle/${encodeURIComponent(item.vehicleId)}`, source: "garage", boost: boostFor(item) });
      }
    };

    addVehicleRecords(data.maintenance, "Maintenance", (item) => item.name, (item) => compact([item.priority, item.nextDueDate]));
    addVehicleRecords(data.issues, "Issue", (item) => item.title, (item) => compact([item.status, item.severity, item.description]), (item) => item.status !== "resolved" ? 28 : 0);
    addVehicleRecords(data.services, "Service", (item) => item.title, (item) => compact([item.date, item.shop, item.description]));
    addVehicleRecords(data.modifications, "Modification", (item) => item.name, (item) => compact([item.category, item.status, item.brand, item.partNumber, item.description]));
    addVehicleRecords(data.fuelRecords, "Fuel", (item) => item.station ?? "Fuel fill-up", (item) => compact([item.date, item.station, item.fuelGrade, `${item.gallons} gallons`]));
    addVehicleRecords(data.reminders, "Reminder", (item) => item.title, (item) => compact([item.dueDate, item.completed ? "completed" : "open"]), (item) => item.completed ? 0 : 16);
    addVehicleRecords(data.diagnosticScans, "Diagnostic scan", (item) => item.codes.map((code) => code.code).join(", ") || "Clean diagnostic scan", (item) => compact([item.timestamp, ...item.codes.map((code) => code.description)]), (item) => item.codes.length ? 26 : 4);

    return bounded(records, limit);
  },
};

export const projectsSearchProvider: SearchProvider = {
  id: "projects",
  categories: ["projects"],
  search(query, { limit }) {
    const data = readProjectsSnapshot();
    const projectName = new Map(data.projects.map((project) => [project.id, project.title]));
    const records: SearchProviderRecord[] = [];

    for (const project of data.projects) {
      if (!matches(query, project.title, project.description, project.status, ...project.tags)) continue;
      records.push({ id: `project:${project.id}`, category: "projects", title: project.title, subtitle: `Project · ${project.status}`, description: truncate(project.description ?? project.tags.join(" · ")), keywords: ["project", project.status, ...project.tags], searchableText: project.description, icon: "◫", href: "/projects", source: "projects", updatedAt: project.updatedAt, boost: project.status === "active" ? 14 : project.status === "archived" ? -20 : 0 });
    }

    for (const task of data.tasks) {
      if (!matches(query, task.title, task.description, projectName.get(task.projectId), task.priority)) continue;
      const overdue = !task.completed && task.dueDate && Date.parse(task.dueDate) < Date.now();
      records.push({ id: `task:${task.id}`, category: "projects", title: task.title, subtitle: `Task · ${projectName.get(task.projectId) ?? "Project"}`, description: truncate(task.description ?? (task.completed ? "Completed" : "Open task")), keywords: ["task", task.priority], searchableText: task.description, icon: "✓", href: "/projects", source: "projects", updatedAt: task.updatedAt, boost: overdue ? 30 : task.completed ? -4 : 10 });
    }

    for (const milestone of data.milestones) {
      if (!matches(query, milestone.title, milestone.description, projectName.get(milestone.projectId))) continue;
      records.push({ id: `milestone:${milestone.id}`, category: "projects", title: milestone.title, subtitle: `Milestone · ${projectName.get(milestone.projectId) ?? "Project"}`, description: truncate(milestone.description ?? (milestone.completed ? "Completed" : "Upcoming milestone")), keywords: ["milestone"], searchableText: milestone.description, icon: "◎", href: "/projects", source: "projects", updatedAt: milestone.updatedAt, boost: milestone.completed ? 0 : 8 });
    }

    return bounded(records, limit);
  },
};

export const notesSearchProvider: SearchProvider = {
  id: "notes",
  categories: ["notes"],
  search(query, { limit }) {
    return bounded(readNotesSnapshot().notes
      .filter((note) => matches(query, note.title, note.body, note.folder, ...note.tags))
      .map((note) => ({ id: note.id, category: "notes" as const, title: note.title || "Untitled note", subtitle: compact([note.folder, ...note.tags.slice(0, 2)]).join(" · ") || "Note", description: snippet(note.body, query), keywords: ["note", ...note.tags], searchableText: note.body, icon: "✎", href: "/notes", source: "notes", updatedAt: note.updatedAt, boost: note.pinned ? 12 : note.archived ? -18 : 0 })), limit);
  },
};

export const clockSearchProvider: SearchProvider = {
  id: "clock",
  categories: ["clock"],
  search(query, { limit }) {
    const data = readClockSnapshot();
    const records: SearchProviderRecord[] = [];
    for (const location of data.worldClocks) {
      if (!matches(query, location.label, location.timeZone, "world clock")) continue;
      records.push({ id: `world:${location.id}`, category: "clock", title: location.label, subtitle: "World clock", description: location.timeZone.replaceAll("_", " "), keywords: ["world", "clock", "timezone"], icon: "◷", href: "/clock", source: "clock", updatedAt: location.createdAt });
    }
    for (const alarm of data.alarms) {
      if (!matches(query, alarm.label, alarm.time, "alarm")) continue;
      records.push({ id: `alarm:${alarm.id}`, category: "clock", title: alarm.label || "Alarm", subtitle: `Alarm · ${alarm.time}`, description: alarm.enabled ? "Enabled" : "Disabled", keywords: ["alarm", "wake"], icon: "◷", href: "/clock", source: "clock", updatedAt: alarm.updatedAt, boost: alarm.enabled ? 12 : 0 });
    }
    for (const timer of data.timers) {
      if (!matches(query, timer.label, timer.status, "timer")) continue;
      records.push({ id: `timer:${timer.id}`, category: "clock", title: timer.label || "Timer", subtitle: `Timer · ${timer.status}`, description: `${Math.round(timer.durationMs / 60_000)} minute timer`, keywords: ["timer", "countdown"], icon: "◷", href: "/clock", source: "clock", updatedAt: timer.createdAt, boost: timer.status === "running" ? 32 : 0 });
    }
    return bounded(records, limit);
  },
};

interface CalendarWireEvent extends Record<string, unknown> {
  id: string;
  title: string;
  start: string;
  end: string;
}

function isCalendarWireEvent(value: unknown): value is CalendarWireEvent {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" && typeof value.start === "string" && typeof value.end === "string";
}

export const calendarSearchProvider: SearchProvider = {
  id: "calendar",
  categories: ["calendar"],
  mode: "remote",
  async search(query, { signal, limit }) {
    const response = await fetch("/api/calendar", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Calendar unavailable");
    const payload: unknown = await response.json();
    if (!isRecord(payload)) throw new Error("Invalid calendar response");
    const events = [...(Array.isArray(payload.today) ? payload.today : []), ...(Array.isArray(payload.upcoming) ? payload.upcoming : [])]
      .filter(isCalendarWireEvent);
    const currentId = isCalendarWireEvent(payload.currentEvent) ? payload.currentEvent.id : undefined;
    const unique = new Map(events.map((event) => [event.id, event]));
    return bounded([...unique.values()]
      .filter((event) => matches(query, event.title, text(event.location), text(event.description), text(event.calendarName)))
      .map((event) => ({ id: event.id, category: "calendar" as const, title: event.title, subtitle: compact([formatDate(event.start), text(event.location)]).join(" · "), description: truncate(text(event.description) || text(event.calendarName) || "Calendar event"), keywords: compact(["event", text(event.calendarName), text(event.location)]), icon: "□", href: "/calendar", source: "calendar", updatedAt: event.start, boost: event.id === currentId ? 42 : Math.max(0, 20 - Math.abs((Date.parse(event.start) - Date.now()) / 86_400_000)) })), limit);
  },
};

interface MailWireMessage extends Record<string, unknown> {
  id: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
}

function isMailWireMessage(value: unknown): value is MailWireMessage {
  return isRecord(value) && typeof value.id === "string" && typeof value.subject === "string" && typeof value.bodyText === "string" && typeof value.receivedAt === "string";
}

export const mailSearchProvider: SearchProvider = {
  id: "mail",
  categories: ["mail"],
  mode: "remote",
  async search(query, { signal, limit }) {
    const response = await fetch("/api/mail?limit=30", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Mail unavailable");
    const payload: unknown = await response.json();
    if (!isRecord(payload)) throw new Error("Invalid mail response");
    return bounded((Array.isArray(payload.messages) ? payload.messages : [])
      .filter(isMailWireMessage)
      .filter((message) => {
        const from = isRecord(message.from) ? compact([text(message.from.name), text(message.from.email)]).join(" ") : "";
        return matches(query, message.subject, from, message.bodyText);
      })
      .map((message) => {
        const from = isRecord(message.from) ? text(message.from.name) || text(message.from.email) : "Mail";
        return { id: message.id, category: "mail" as const, title: message.subject || "No subject", subtitle: compact([from, formatDate(message.receivedAt)]).join(" · "), description: snippet(message.bodyText, query), keywords: ["mail", "email", from], searchableText: message.bodyText, icon: "✉", href: "/gmail", source: "mail", updatedAt: message.receivedAt, boost: message.unread === true ? 8 : 0 };
      }), limit);
  },
};

interface SportsWireEvent extends Record<string, unknown> {
  id: string;
  title: string;
  start: string;
  status: string;
  sport: string;
}

function isSportsWireEvent(value: unknown): value is SportsWireEvent {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" && typeof value.start === "string" && typeof value.status === "string" && typeof value.sport === "string";
}

export const sportsSearchProvider: SearchProvider = {
  id: "sports",
  categories: ["sports"],
  mode: "remote",
  async search(query, { signal, limit }) {
    const response = await fetch("/api/sports", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Sports unavailable");
    const payload: unknown = await response.json();
    if (!isRecord(payload)) throw new Error("Invalid sports response");
    const eventValues = [payload.live, payload.upcoming, payload.recent, payload.featured]
      .flatMap((value) => Array.isArray(value) ? value : [])
      .filter(isSportsWireEvent);
    const standings = isRecord(payload.standings)
      ? Object.values(payload.standings).flatMap((value) => Array.isArray(value) ? value : [])
      : [];
    const events: SearchProviderRecord[] = [...new Map(eventValues.map((event) => [event.id, event])).values()]
      .filter((event) => matches(query, event.title, event.sport, event.status, text(event.venue), text(event.broadcast)))
      .map((event) => ({ id: `event:${event.id}`, category: "sports", title: event.title, subtitle: `${event.sport.toUpperCase()} · ${event.status}`, description: compact([formatDate(event.start), text(event.venue), text(event.broadcast)]).join(" · "), keywords: ["sports", event.sport, event.status], icon: "◉", href: `/sports/event/${encodeURIComponent(event.id)}`, source: "sports", updatedAt: event.start, boost: event.status === "live" ? 38 : 0 }));
    const standingRecords: SearchProviderRecord[] = standings.filter(isRecord)
      .filter((standing) => matches(query, text(standing.name), text(standing.team), text(standing.driver), text(standing.sport)))
      .map((standing, index) => ({ id: `standing:${text(standing.id) || index}`, category: "sports", title: text(standing.name) || text(standing.team) || text(standing.driver), subtitle: compact([text(standing.sport).toUpperCase(), typeof standing.rank === "number" ? `Rank ${standing.rank}` : undefined]).join(" · "), description: compact([text(standing.record), typeof standing.points === "number" ? `${standing.points} points` : undefined]).join(" · "), keywords: compact(["sports", text(standing.sport), text(standing.team), text(standing.driver)]), icon: "◉", href: "/sports", source: "sports" }));
    const directoryRecords: SearchProviderRecord[] = allSportsDirectoryEntries
      .filter((entry) => matches(query, entry.name, entry.shortName, entry.abbreviation, entry.id, entry.sport, entry.entityType))
      .map((entry) => ({
        id: `directory:${entry.id}`,
        category: "sports",
        title: entry.name,
        subtitle: compact([entry.sport.toUpperCase(), entry.entityType]).join(" · "),
        description: compact([entry.abbreviation, entry.driverNumber ? `#${entry.driverNumber}` : undefined, entry.carNumber ? `#${entry.carNumber}` : undefined, "Sports directory"]).join(" · "),
        keywords: compact(["sports", entry.sport, entry.entityType, entry.abbreviation, entry.shortName]),
        icon: "◉",
        href: entry.entityType === "team" ? `/sports/team/${encodeURIComponent(entry.sport)}/${encodeURIComponent(entry.id.slice(entry.sport.length + 1))}` : entry.sport === "f1" ? `/sports/f1/${entry.entityType === "constructor" ? "constructor" : "driver"}/${encodeURIComponent(entry.id)}` : entry.sport === "nascar" && entry.entityType === "driver" ? `/sports/nascar/driver/${encodeURIComponent(entry.id)}` : "/settings",
        source: "sports",
        boost: 4,
      }));
    return bounded([...events, ...standingRecords, ...directoryRecords], limit);
  },
};

export const musicSearchProvider: SearchProvider = {
  id: "music",
  categories: ["music"],
  mode: "remote",
  async search(query, { signal }) {
    const response = await fetch("/api/music", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Music unavailable");
    const payload: unknown = await response.json();
    if (!isRecord(payload) || !isRecord(payload.playback) || !isRecord(payload.playback.track)) return [];
    const track = payload.playback.track;
    const artists = Array.isArray(track.artists) ? track.artists.filter((artist): artist is string => typeof artist === "string") : [];
    const title = text(track.title);
    if (!title || !matches(query, title, ...artists, text(track.album))) return [];
    return [{ id: text(track.id) || "current", category: "music", title, subtitle: artists.join(", ") || "Current track", description: compact([text(track.album), payload.playback.playing === true ? "Now playing" : "Paused"]).join(" · "), keywords: ["music", "song", "track", ...artists], icon: "♫", href: "/music", source: "music", updatedAt: text(payload.playback.updatedAt), boost: payload.playback.playing === true ? 34 : 12 }];
  },
};

export const financeSearchProvider: SearchProvider = {
  id: "finance",
  categories: ["finance"],
  search(query, { limit }) {
    const data = readFinanceSnapshot();
    const categoryName = new Map(data.categories.map((category) => [category.id, category.name]));
    const records: SearchProviderRecord[] = data.accounts
      .filter((account) => matches(query, account.name, account.type, account.institution))
      .map((account) => ({ id: `account:${account.id}`, category: "finance", title: account.name, subtitle: `Account · ${account.type}`, description: account.archived ? "Archived account" : "Manual records", keywords: ["finance", "account", account.type], icon: "$", href: "/finance", source: "finance", boost: account.archived ? -10 : 12 }));

    data.transactions.forEach((transaction) => {
      const category = categoryName.get(transaction.categoryId);
      if (!matches(query, transaction.description, transaction.merchant, category, transaction.direction, transaction.status)) return;
      records.push({ id: `transaction:${transaction.id}`, category: "finance", title: transaction.merchant || transaction.description, subtitle: compact([category, transaction.status]).join(" · ") || "Transaction", description: "Manual financial record", keywords: ["finance", transaction.direction, transaction.status, category ?? ""], icon: transaction.direction === "income" ? "↗" : "↘", href: "/finance", source: "finance", updatedAt: transaction.updatedAt });
    });
    data.recurringItems.filter((item) => item.active)
      .filter((item) => matches(query, item.name, item.merchant, categoryName.get(item.categoryId), item.cadence))
      .forEach((item) => records.push({ id: `recurring:${item.id}`, category: "finance", title: item.name, subtitle: `Expected · ${item.cadence}`, description: `Next expected ${item.nextExpectedDate}`, keywords: ["finance", "expected", "recurring", item.cadence], icon: "↻", href: "/finance", source: "finance", updatedAt: item.updatedAt }));
    return bounded(records, limit);
  },
};

export function createSearchProviders(options: { schoolEnabled?: boolean } = {}): SearchProvider[] {
  const schoolEnabled = options.schoolEnabled ?? false;
  return [
    createAppsSearchProvider(schoolEnabled),
    settingsSearchProvider,
    systemSearchProvider,
    ...(schoolEnabled ? [schoolSearchProvider] : []),
    garageSearchProvider,
    projectsSearchProvider,
    notesSearchProvider,
    clockSearchProvider,
    calendarSearchProvider,
    mailSearchProvider,
    sportsSearchProvider,
    musicSearchProvider,
    financeSearchProvider,
  ];
}
