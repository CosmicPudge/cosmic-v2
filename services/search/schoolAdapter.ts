import type { SearchProviderRecord, SearchQuery } from "@/core/contracts/Search";
import type { SchoolSnapshot } from "@/services/school/domain";

function matches(query: SearchQuery, ...values: Array<string | undefined>) {
  const haystack = values.filter(Boolean).join(" ").toLocaleLowerCase();
  return query.tokens.every((token) => haystack.includes(token));
}

function date(value: Date | undefined) {
  return value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value) : undefined;
}

export function schoolSnapshotSearchRecords(snapshot: SchoolSnapshot, query: SearchQuery): SearchProviderRecord[] {
  const records: SearchProviderRecord[] = [];
  for (const course of snapshot.courses) {
    if (matches(query, course.name, course.location)) records.push({ id: `school:course:${course.id}`, category: "school", title: course.name, subtitle: "School Course", description: course.location, keywords: ["school", "course", "class"], icon: "🎓", href: "/school/courses", source: "school", boost: 16 });
  }
  for (const assignment of snapshot.assignments) {
    if (matches(query, assignment.title, "school assignment")) records.push({ id: `school:assignment:${assignment.id}`, category: "school", title: assignment.title, subtitle: `School Assignment${date(assignment.due) ? ` · Due ${date(assignment.due)}` : ""}`, description: "School assignment", keywords: ["school", "assignment"], icon: "✓", href: "/school/assignments", source: "school", boost: 18, updatedAt: assignment.due.toISOString() });
  }
  for (const event of snapshot.events) {
    if (matches(query, event.title, event.location, event.course)) records.push({ id: `school:event:${event.source}:${event.id}`, category: "school", title: event.title, subtitle: `School Event${date(event.start) ? ` · ${date(event.start)}` : ""}`, description: event.location, keywords: ["school", "event", event.type], icon: "◷", href: "/school", source: "school", boost: 12, updatedAt: event.start.toISOString() });
  }
  for (const item of snapshot.actionItems) {
    if (matches(query, item.title, "school action item")) records.push({ id: `school:action:${item.id}`, category: "school", title: item.title, subtitle: "School Action Item", description: date(item.due) ? `Due ${date(item.due)}` : undefined, keywords: ["school", "action", "assignment"], icon: "!", href: "/school/assignments", source: "school", boost: 14 });
  }
  for (const event of snapshot.sourceIntelligence?.events ?? []) {
    if (matches(query, event.title, event.location?.name, event.attire?.value, ...(event.requiredItems ?? []))) records.push({ id: `school:source-event:${event.id}`, category: "school", title: event.title, subtitle: "School source event", description: [event.location?.name, event.attire?.value].filter(Boolean).join(" · ") || undefined, keywords: ["school", "source", "event", event.eventType ?? ""], icon: "◈", href: "/school/sources", source: "school", boost: 15 });
  }
  for (const fact of snapshot.sourceIntelligence?.facts ?? []) {
    if (matches(query, fact.subject, fact.value, "school source")) records.push({ id: `school:source-fact:${fact.id}`, category: "school", title: fact.value, subtitle: `School source · ${fact.subject}`, description: `Certainty: ${fact.certainty}`, keywords: ["school", "source", fact.kind], icon: "◇", href: "/school/sources", source: "school", boost: 10 });
  }
  return records;
}
