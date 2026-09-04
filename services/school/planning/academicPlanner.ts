import type { SchoolSnapshot } from "@/services/school/domain";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { isAssignmentActiveForPlanning, isAssignmentOverdue } from "../planning";

export type AcademicRecommendationKind = "do-now" | "do-next" | "prepare" | "warning" | "quick-win" | "upcoming";
export type CourseRisk = "LOW" | "NORMAL" | "ELEVATED" | "HIGH";
export interface AvailableTimeBlock { start: Date; end: Date; minutes: number; }
export interface CourseAcademicState { courseId: string; nextAssignment?: SchoolPlanningAssignment; overdueCount: number; dueTodayCount: number; dueThisWeekCount: number; nextAssessment?: SchoolSnapshot["events"][number]; knownWorkloadMinutes: number | null; unknownDurationCount: number; importantRequirements: SchoolSnapshot["requirements"]; unresolvedConflictCount: number; recentNotes: SchoolSnapshot["notes"]; risk: CourseRisk; riskReasons: string[]; }

export interface AcademicRecommendation {
  id: string;
  kind: AcademicRecommendationKind;
  title: string;
  reasonCodes: string[];
  courseId?: string;
  assignmentId?: string;
  dueAt?: Date | null;
  estimatedMinutes?: number | null;
  urgencyScore: number;
  importanceScore: number;
  readinessScore: number;
  finalScore: number;
  explanation: string;
  provenance?: unknown;
}

export interface AcademicState {
  now: Date;
  currentClass?: SchoolSnapshot["events"][number];
  nextClass?: SchoolSnapshot["events"][number];
  remainingClassesToday: SchoolSnapshot["events"];
  assignments: SchoolPlanningAssignment[];
  overdue: SchoolPlanningAssignment[];
  dueToday: SchoolPlanningAssignment[];
  dueTomorrow: SchoolPlanningAssignment[];
  dueWithin3Days: SchoolPlanningAssignment[];
  dueWithin7Days: SchoolPlanningAssignment[];
  examsAndQuizzes: SchoolSnapshot["events"];
  upcomingRequirements: SchoolSnapshot["requirements"];
  courseWorkload: Record<string, { active: number; overdue: number; estimatedMinutes: number | null }>;
  calendarCommitments: SchoolSnapshot["events"];
  availableTimeBlocks: AvailableTimeBlock[];
  conflicts: NonNullable<SchoolSnapshot["conflicts"]>;
  minutesUntilNextClass: number | null;
  lastClassToday?: SchoolSnapshot["events"][number];
  deadlinesBeforeNextClass: SchoolPlanningAssignment[];
  tomorrowMorningDeadlines: SchoolPlanningAssignment[];
}

function sameDay(left: Date, right: Date) { return left.toLocaleDateString() === right.toLocaleDateString(); }
const active = isAssignmentActiveForPlanning;
function dueIn(item: SchoolPlanningAssignment, now: Date, days: number) { return !!item.dueAt && item.dueAt >= now && item.dueAt.getTime() <= now.getTime() + days * 86_400_000; }

export function buildAcademicState(snapshot: SchoolSnapshot, now = new Date()): AcademicState {
  const assignments = (snapshot.planningAssignments ?? []).filter(active);
  const classes = snapshot.events.filter((event) => event.type === "class").sort((a, b) => a.start.getTime() - b.start.getTime());
  const currentClass = classes.find((event) => event.start <= now && event.end > now);
  const nextClass = classes.find((event) => event.start > now);
  const todayClasses = classes.filter((event) => sameDay(event.start, now) && event.end >= now);
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const overdue = assignments.filter((item) => isAssignmentOverdue(item, now));
  const dueToday = assignments.filter((item) => item.dueAt && sameDay(item.dueAt, now));
  const dueTomorrow = assignments.filter((item) => item.dueAt && sameDay(item.dueAt, tomorrow));
  const workload: AcademicState["courseWorkload"] = {};
  for (const item of assignments) {
    const key = item.courseId ?? "unassigned";
    const current = workload[key] ?? { active: 0, overdue: 0, estimatedMinutes: 0 };
    workload[key] = { active: current.active + 1, overdue: current.overdue + (isAssignmentOverdue(item, now) ? 1 : 0), estimatedMinutes: current.estimatedMinutes === null || item.estimatedMinutes === undefined ? null : current.estimatedMinutes + item.estimatedMinutes };
  }
  const minutesUntilNextClass = nextClass ? Math.max(0, Math.round((nextClass.start.getTime() - now.getTime()) / 60_000)) : null;
  return {
    now, currentClass, nextClass, remainingClassesToday: todayClasses,
    assignments, overdue, dueToday, dueTomorrow,
    dueWithin3Days: assignments.filter((item) => dueIn(item, now, 3)),
    dueWithin7Days: assignments.filter((item) => dueIn(item, now, 7)),
    examsAndQuizzes: snapshot.events.filter((event) => event.type === "exam" || event.type === "quiz"),
    upcomingRequirements: snapshot.requirements.filter((item) => !item.relevantDate || item.relevantDate >= now),
    courseWorkload: workload,
    calendarCommitments: snapshot.events,
    availableTimeBlocks: availableBlocks(snapshot.events, now),
    conflicts: snapshot.conflicts ?? [],
    minutesUntilNextClass,
    lastClassToday: todayClasses.at(-1),
    deadlinesBeforeNextClass: nextClass ? assignments.filter((item) => item.dueAt && item.dueAt <= nextClass.start && item.dueAt >= now) : [],
    tomorrowMorningDeadlines: assignments.filter((item) => item.dueAt && sameDay(item.dueAt, tomorrow) && item.dueAt.getHours() < 12),
  };
}

function availableBlocks(events: SchoolSnapshot["events"], now: Date): AvailableTimeBlock[] {
  const commitments = events.filter((event) => event.end > now && sameDay(event.start, now)).sort((a, b) => a.start.getTime() - b.start.getTime());
  const blocks: AvailableTimeBlock[] = []; let cursor = now;
  for (const event of commitments) { if (event.start > cursor) blocks.push({ start: cursor, end: event.start, minutes: Math.floor((event.start.getTime() - cursor.getTime()) / 60_000) }); if (event.end > cursor) cursor = event.end; }
  return blocks;
}

export function courseAcademicState(snapshot: SchoolSnapshot, courseId: string, now = new Date()): CourseAcademicState {
  const state = buildAcademicState(snapshot, now); const items = state.assignments.filter((item) => item.courseId === courseId); const overdueCount = items.filter((item) => isAssignmentOverdue(item, now)).length; const dueTodayCount = items.filter((item) => item.dueAt && sameDay(item.dueAt, now)).length; const dueThisWeekCount = items.filter((item) => dueIn(item, now, 7)).length; const assessment = snapshot.events.filter((event) => (event.type === "exam" || event.type === "quiz") && event.start >= now).sort((a, b) => a.start.getTime() - b.start.getTime())[0]; const known = items.filter((item) => item.estimatedMinutes !== undefined).reduce((total, item) => total + (item.estimatedMinutes ?? 0), 0); const unknownDurationCount = items.filter((item) => item.estimatedMinutes === undefined).length; const requirements = snapshot.requirements.filter((item) => item.courseId === courseId || !item.courseId); const unresolvedConflictCount = state.conflicts.filter((conflict) => conflict.description.toLocaleLowerCase().includes(courseId.toLocaleLowerCase())).length; const notes = snapshot.notes.filter((item) => item.courseId === courseId).slice(0, 5); const riskReasons = []; if (overdueCount) riskReasons.push(`${overdueCount} overdue assignment${overdueCount === 1 ? "" : "s"}`); if (dueThisWeekCount >= 2) riskReasons.push(`${dueThisWeekCount} assignments due this week`); if (assessment && assessment.start.getTime() - now.getTime() <= 3 * 86_400_000) riskReasons.push("assessment within 3 days"); if (unresolvedConflictCount) riskReasons.push("unresolved planning conflict"); const risk: CourseRisk = overdueCount >= 2 || (overdueCount > 0 && !!assessment) ? "HIGH" : riskReasons.length >= 2 ? "ELEVATED" : riskReasons.length ? "NORMAL" : "LOW"; return { courseId, nextAssignment: items.filter((item) => active(item)).sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity))[0], overdueCount, dueTodayCount, dueThisWeekCount, nextAssessment: assessment, knownWorkloadMinutes: unknownDurationCount ? (known || null) : known, unknownDurationCount, importantRequirements: requirements, unresolvedConflictCount, recentNotes: notes, risk, riskReasons };
}

function recommendationFor(item: SchoolPlanningAssignment, state: AcademicState): AcademicRecommendation {
  const reasons: string[] = []; const now = state.now; const due = item.dueAt;
  const hours = due ? (due.getTime() - now.getTime()) / 3_600_000 : null;
  const urgency = due ? due < now ? 100 : hours! <= 24 ? 90 : hours! <= 72 ? 70 : hours! <= 168 ? 45 : 15 : 10;
  const importance = item.priority === "critical" ? 40 : item.priority === "high" ? 30 : item.priority === "normal" ? 15 : 5;
  const readiness = item.planningStatus === "in_progress" ? 15 : item.planningStatus === "planned" ? 10 : 5;
  if (due && due < now) reasons.push("OVERDUE"); else if (due && sameDay(due, now)) reasons.push("DUE_TODAY"); else if (due && sameDay(due, new Date(now.getTime() + 86_400_000))) reasons.push("DUE_TOMORROW");
  if (item.priority === "high" || item.priority === "critical") reasons.push("HIGH_PRIORITY");
  if (item.estimatedMinutes !== undefined) { if (item.estimatedMinutes <= 60) reasons.push("SHORT_TASK"); } else reasons.push("NO_DURATION");
  if (item.planningStatus === "planned" || item.planningStatus === "in_progress") reasons.push("MANUALLY_PLANNED");
  const fittingBlock = item.estimatedMinutes !== undefined && state.availableTimeBlocks.some((block) => block.minutes >= item.estimatedMinutes!);
  if (fittingBlock) reasons.push("FITS_AVAILABLE_BLOCK");
  const finalScore = urgency + importance + readiness + (fittingBlock ? 8 : 0);
  const explanation = reasons.includes("OVERDUE") ? "Overdue and unfinished." : reasons.includes("DUE_TODAY") ? "Due today and unfinished." : reasons.includes("DUE_TOMORROW") ? "Due tomorrow and unfinished." : reasons.includes("SHORT_TASK") ? "A known short task that can make useful progress quickly." : due ? "Upcoming unfinished work, ordered by deadline and priority." : "Unfinished work with no due date; deadline is unknown.";
  const kind: AcademicRecommendationKind = reasons.includes("OVERDUE") || reasons.includes("DUE_TODAY") ? "do-now" : reasons.includes("SHORT_TASK") ? "quick-win" : due ? "upcoming" : "prepare";
  return { id: `academic:${item.id}`, kind, title: item.title, reasonCodes: reasons, ...(item.courseId ? { courseId: item.courseId } : {}), assignmentId: item.id, dueAt: due ?? null, estimatedMinutes: item.estimatedMinutes ?? null, urgencyScore: urgency, importanceScore: importance, readinessScore: readiness, finalScore, explanation, provenance: item.provenance };
}

export function buildAcademicRecommendations(state: AcademicState): AcademicRecommendation[] {
  const ranked = state.assignments.map((item) => recommendationFor(item, state)).sort((a, b) => b.finalScore - a.finalScore || a.title.localeCompare(b.title));
  const recommendations = ranked.map((item, index) => ({ ...item, kind: index === 0 ? "do-now" as const : index === 1 ? "do-next" as const : item.kind }));
  if (state.nextClass && state.minutesUntilNextClass !== null && state.minutesUntilNextClass <= 20) {
    const relevant = state.assignments.some((item) => item.courseId && state.nextClass?.course?.toLocaleLowerCase().includes(item.courseId.toLocaleLowerCase())) || state.upcomingRequirements.length > 0 || state.calendarCommitments.some((event) => event.title.toLocaleLowerCase().includes(state.nextClass?.title.toLocaleLowerCase() ?? ""));
    if (relevant) recommendations.push({ id: `academic:prepare:${state.nextClass.id}`, kind: "prepare", title: `Prepare for ${state.nextClass.title}`, reasonCodes: ["CLASS_SOON"], dueAt: state.nextClass.start, estimatedMinutes: null, urgencyScore: 85, importanceScore: 25, readinessScore: 10, finalScore: 120, explanation: "Your next class starts soon; use the remaining time for known course preparation." });
  }
  for (const exam of state.examsAndQuizzes.filter((event) => event.start >= state.now).slice(0, 3)) recommendations.push({ id: `academic:${exam.id}`, kind: "prepare", title: `Prepare for ${exam.title}`, reasonCodes: ["EXAM_SOON"], dueAt: exam.start, estimatedMinutes: null, urgencyScore: 60, importanceScore: 25, readinessScore: 5, finalScore: 90, explanation: "An upcoming exam or quiz needs preparation before its start time." });
  return recommendations.sort((a, b) => b.finalScore - a.finalScore || a.title.localeCompare(b.title));
}

export function planAcademicState(snapshot: SchoolSnapshot, now = new Date()) {
  const state = buildAcademicState(snapshot, now);
  return { state, recommendations: buildAcademicRecommendations(state) };
}
