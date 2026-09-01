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
  for (const assignment of snapshot.planningAssignments ?? []) {
    if (matches(query, assignment.title, assignment.courseName, "school assignment")) records.push({ id: `school:planning-assignment:${assignment.id}`, category: "school", title: assignment.title, subtitle: `School Planning${date(assignment.dueAt) ? ` · Due ${date(assignment.dueAt)}` : ""}`, description: assignment.description, keywords: ["school", "assignment", "planning", assignment.sourceType], icon: "✓", href: "/school/assignments", source: "school", boost: 19, updatedAt: assignment.updatedAt.toISOString() });
  }
  for (const event of snapshot.events) {
    if (matches(query, event.title, event.location, event.course)) records.push({ id: `school:event:${event.source}:${event.id}`, category: "school", title: event.title, subtitle: `School Event${date(event.start) ? ` · ${date(event.start)}` : ""}`, description: event.location, keywords: ["school", "event", event.type], icon: "◷", href: "/school", source: "school", boost: 12, updatedAt: event.start.toISOString() });
  }
  for (const item of snapshot.actionItems) {
    if (matches(query, item.title, "school action item")) records.push({ id: `school:action:${item.id}`, category: "school", title: item.title, subtitle: "School Action Item", description: date(item.due) ? `Due ${date(item.due)}` : undefined, keywords: ["school", "action", "assignment"], icon: "!", href: "/school/assignments", source: "school", boost: 14 });
  }
  for (const note of snapshot.notes ?? []) {
    if (matches(query, note.title, note.content, ...note.topics, "school note")) records.push({ id: `school:note:${note.id}`, category: "school", title: note.title, subtitle: "School note", description: note.topics.join(" · ") || note.content.slice(0, 160), keywords: ["school", "note", ...note.topics], icon: "✎", href: `/school/notes/${encodeURIComponent(note.id)}`, source: "school", boost: 13, updatedAt: note.updatedAt.toISOString() });
  }
  for (const topic of snapshot.topics ?? []) {
    if (matches(query, topic.value, "school topic")) records.push({ id: `school:topic:${topic.noteId}:${topic.value}`, category: "school", title: topic.value, subtitle: "School topic", description: "From a study note", keywords: ["school", "topic"], icon: "◇", href: `/school/notes/${encodeURIComponent(topic.noteId)}`, source: "school", boost: 11, updatedAt: topic.createdAt.toISOString() });
  }
  for (const requirement of snapshot.requirements ?? []) {
    if (matches(query, requirement.value, requirement.category, "school requirement")) records.push({ id: `school:requirement:${requirement.id}`, category: "school", title: requirement.value, subtitle: `School requirement · ${requirement.category}`, description: requirement.evidence, keywords: ["school", "requirement", requirement.category], icon: "!", href: "/school/week", source: "school", boost: 14 });
  }
  for (const fact of snapshot.importantFacts ?? []) {
    if (matches(query, fact.subject, fact.value, "school fact")) records.push({ id: `school:important-fact:${fact.id}`, category: "school", title: fact.value, subtitle: `School fact · ${fact.subject}`, description: fact.evidence, keywords: ["school", "fact"], icon: "◇", href: "/school/inbox", source: "school", boost: 11 });
  }
  for (const plan of snapshot.coursePlans ?? []) {
    const href = `/school/courses/${encodeURIComponent(plan.courseId)}`;
    const add = (id: string, title: string, subtitle: string, description: string | undefined, keywords: string[], boost = 10) => { if (matches(query, title, subtitle, description, ...keywords)) records.push({ id, category: "school", title, subtitle, description, keywords: ["school", "course-plan", ...keywords], icon: "◇", href, source: "school", boost }); };
    for (const meeting of plan.meetingSchedule) add(`school:meeting:${plan.courseId}:${String(meeting.value ?? meeting.daysOfWeek ?? "meeting")}`, String(meeting.value ?? `${meeting.daysOfWeek ?? ""} ${meeting.startTime ?? ""}`), "Course meeting schedule", "Approved course-plan information", ["meeting", "schedule"], 9);
    for (const office of plan.officeHours) add(`school:office:${plan.courseId}:${String(office.value ?? office.daysOfWeek ?? "office")}`, String(office.value ?? `${office.daysOfWeek ?? ""} ${office.startTime ?? ""}`), "Course office hours", String(office.notes ?? "Approved course-plan information"), ["office", "hours"], 9);
    for (const grade of plan.grading) add(`school:grading:${plan.courseId}:${grade.category}`, `${grade.category} ${grade.weight}%`, "Course grading", "Approved course-plan information", ["grading"], 8);
    for (const scale of plan.gradeScale) add(`school:grade-scale:${plan.courseId}:${String(scale.letter ?? scale.value ?? "grade")}`, String(scale.value ?? `${scale.letter ?? ""} ${scale.minimumPercent ?? ""}%`), "Course grade scale", "Approved course-plan information", ["grade", "scale"], 8);
    for (const book of plan.textbooks) add(`school:textbook:${plan.courseId}:${String(book.title ?? book.value ?? "book")}`, String(book.title ?? book.value ?? "Textbook"), "Course textbook", undefined, ["textbook", "book"], 9);
    for (const policy of plan.policies) add(`school:policy:${plan.courseId}:${policy.subject}`, policy.value, `Course policy · ${policy.subject}`, "Approved course-plan information", ["policy", policy.subject], 14);
    for (const recurring of plan.recurringExpectations) add(`school:recurring:${plan.courseId}:${String(recurring.description ?? recurring.value ?? "expectation")}`, String(recurring.description ?? recurring.value ?? "Recurring expectation"), "Recurring course expectation", undefined, ["recurring", "expectation"], 9);
    for (const weekly of plan.weeklySchedule) add(`school:week:${plan.courseId}:${weekly.week}:${weekly.value}`, weekly.value, weekly.week ? `Course week ${weekly.week}` : "Course weekly schedule", undefined, ["weekly", "schedule"], 9);
    for (const assignment of plan.majorAssignments) add(`school:plan-assignment:${plan.courseId}:${assignment.sourceId}:${assignment.title}`, assignment.title, "Course-plan assignment", assignment.dueAt, ["assignment", "deadline"], 15);
    for (const exam of plan.exams) if (matches(query, exam.title, "school exam", exam.date)) records.push({ id: `school:exam:${plan.courseId}:${exam.title}`, category: "school", title: exam.title, subtitle: "Course exam", description: exam.date, keywords: ["school", "exam"], icon: "!", href: `/school/courses/${encodeURIComponent(plan.courseId)}`, source: "school", boost: 16 });
    for (const material of plan.materials) if (matches(query, material, "school textbook material")) records.push({ id: `school:material:${plan.courseId}:${material}`, category: "school", title: material, subtitle: "Course material", description: "Approved course-plan information", keywords: ["school", "material", "textbook"], icon: "▣", href: `/school/courses/${encodeURIComponent(plan.courseId)}`, source: "school", boost: 12 });
  }
  return records;
}
