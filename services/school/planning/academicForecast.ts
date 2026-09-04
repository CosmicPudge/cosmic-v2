import type { SchoolSnapshot } from "@/services/school/domain";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { isAssignmentActiveForPlanning, isAssignmentOverdue } from "../planning";
import { academicWorkConfig, classifyAcademicWork, isMajorAcademicWork, type AcademicWorkType } from "./academicWork";
import { buildProactivePlan, type ProactivePlan, type RecommendedWorkBlock } from "./academicPlanner";

export type AcademicForecastRisk = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type AcademicForecastTrend = "STEADY" | "RISING" | "FALLING";

export const academicForecastConfig = {
  horizonWeeks: 6,
  collisionWindowDays: 3,
  moderateUtilization: 0.75,
  highUtilization: 0.9,
  criticalUtilization: 1.15,
  majorDeadlineHighCount: 2,
  deadlineConcentrationHighCount: 3,
  getAheadMinutes: 45,
} as const;

export interface AcademicForecastCollision {
  firstTitle: string;
  secondTitle: string;
  firstDate: Date;
  secondDate: Date;
  reason: string;
}

export interface AcademicForecastOpportunity {
  assignmentId: string;
  title: string;
  minutes: number;
  sourceWeekStart: Date;
  targetWeekStart: Date;
  reason: string;
}

export interface AcademicWeekForecast {
  weekStart: Date;
  weekEnd: Date;
  availableMinutes: number;
  plannedMinutes: number;
  deadlineMinutes: number;
  classMinutes: number;
  assignmentCount: number;
  deadlineCount: number;
  examCount: number;
  quizCount: number;
  projectCount: number;
  majorWorkCount: number;
  overdueCarryMinutes: number;
  utilization: number;
  riskLevel: AcademicForecastRisk;
  reasons: string[];
  majorItems: string[];
  collisions: AcademicForecastCollision[];
  opportunities: AcademicForecastOpportunity[];
}

export interface AcademicForecastSummary {
  currentWeekRisk: AcademicForecastRisk;
  highestRiskWeek: AcademicWeekForecast;
  heavyWeekCount: number;
  nextMajorCollision?: AcademicForecastCollision;
  totalUpcomingDeadlines: number;
  totalUpcomingExams: number;
  getAheadOpportunityCount: number;
  trend: AcademicForecastTrend;
}

export interface AcademicForecast {
  generatedAt: Date;
  horizonStart: Date;
  horizonEnd: Date;
  weeks: AcademicWeekForecast[];
  summary: AcademicForecastSummary;
}

type ForecastItem = { title: string; date: Date; type: "exam" | "quiz" | AcademicWorkType; major: boolean };

function dayStart(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date: Date, days: number) { const result = new Date(date); result.setDate(result.getDate() + days); return result; }
function monday(date: Date) { const result = dayStart(date); result.setDate(result.getDate() - ((result.getDay() + 6) % 7)); return result; }
function dayKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function weekLabel(week: AcademicWeekForecast) { return `${week.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${week.weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`; }
function minutesFor(item: SchoolPlanningAssignment) { const type = classifyAcademicWork(item).type; return Math.max(1, item.estimatedMinutes ?? academicWorkConfig.defaultMinutes[type]); }
function inWeek(date: Date, week: AcademicWeekForecast) { return date >= week.weekStart && date <= week.weekEnd; }
function weekFor(date: Date, weeks: AcademicWeekForecast[]) { return weeks.find((week) => inWeek(date, week)); }
function activeAssignments(snapshot: SchoolSnapshot) { return (snapshot.planningAssignments ?? []).filter(isAssignmentActiveForPlanning); }
function classMinutes(snapshot: SchoolSnapshot, week: AcademicWeekForecast) { return snapshot.events.filter((event) => event.type === "class" && inWeek(event.start, week)).reduce((total, event) => total + Math.max(0, Math.round((event.end.getTime() - event.start.getTime()) / 60_000)), 0); }
function riskFor(input: { availableMinutes: number; plannedMinutes: number; utilization: number; overdueCarryMinutes: number; deadlineCount: number; majorWorkCount: number; collisions: AcademicForecastCollision[] }) {
  const reasons: string[] = [];
  if (input.utilization >= academicForecastConfig.criticalUtilization) reasons.push(`Planned work exceeds available capacity by ${Math.round((input.utilization - 1) * 100)}%.`);
  else if (input.utilization >= academicForecastConfig.highUtilization) reasons.push(`Planned work uses ${Math.round(input.utilization * 100)}% of available study capacity.`);
  else if (input.utilization >= academicForecastConfig.moderateUtilization) reasons.push(`Planned work uses ${Math.round(input.utilization * 100)}% of available study capacity.`);
  if (input.overdueCarryMinutes > 0) reasons.push(`${Math.ceil(input.overdueCarryMinutes / 60)} hour${input.overdueCarryMinutes >= 120 ? "s" : ""} of overdue work carries into this week.`);
  if (input.deadlineCount >= academicForecastConfig.deadlineConcentrationHighCount) reasons.push(`${input.deadlineCount} deadlines fall this week.`);
  if (input.majorWorkCount >= academicForecastConfig.majorDeadlineHighCount) reasons.push(`${input.majorWorkCount} major academic items fall this week.`);
  for (const collision of input.collisions) reasons.push(`${collision.firstTitle} and ${collision.secondTitle} fall within ${academicForecastConfig.collisionWindowDays} days.`);
  const critical = input.availableMinutes === 0 && input.plannedMinutes > 0 || input.utilization >= academicForecastConfig.criticalUtilization || input.collisions.length >= 2 || (input.overdueCarryMinutes >= 180 && input.utilization >= academicForecastConfig.highUtilization);
  const high = input.utilization >= academicForecastConfig.highUtilization || input.collisions.length > 0 || input.majorWorkCount >= academicForecastConfig.majorDeadlineHighCount || input.overdueCarryMinutes >= 180;
  const moderate = input.utilization >= academicForecastConfig.moderateUtilization || (input.deadlineCount >= academicForecastConfig.deadlineConcentrationHighCount && input.majorWorkCount > 0) || input.overdueCarryMinutes > 0;
  return { level: critical ? "CRITICAL" as const : high ? "HIGH" as const : moderate ? "MODERATE" as const : "LOW" as const, reasons };
}
function collisionItems(snapshot: SchoolSnapshot, week: AcademicWeekForecast, assignments: SchoolPlanningAssignment[]): ForecastItem[] {
  const items: ForecastItem[] = [];
  for (const event of snapshot.events) {
    if (!inWeek(event.start, week) || (event.type !== "exam" && event.type !== "quiz")) continue;
    items.push({ title: event.title, date: event.start, type: event.type, major: true });
  }
  for (const item of assignments) {
    if (!item.dueAt || !inWeek(item.dueAt, week)) continue;
    const type = classifyAcademicWork(item).type;
    if (isMajorAcademicWork(type)) items.push({ title: item.title, date: item.dueAt, type, major: true });
  }
  return items.sort((left, right) => left.date.getTime() - right.date.getTime() || left.title.localeCompare(right.title));
}
function collisionsFor(items: ForecastItem[]) {
  const collisions: AcademicForecastCollision[] = [];
  for (let index = 0; index < items.length; index += 1) for (let next = index + 1; next < items.length; next += 1) {
    const days = Math.abs(items[next].date.getTime() - items[index].date.getTime()) / 86_400_000;
    if (days > academicForecastConfig.collisionWindowDays) break;
    collisions.push({ firstTitle: items[index].title, secondTitle: items[next].title, firstDate: items[index].date, secondDate: items[next].date, reason: `${items[index].type} + ${items[next].type}` });
  }
  return collisions;
}
function opportunityFor(weeks: AcademicWeekForecast[], plan: ProactivePlan, assignments: SchoolPlanningAssignment[]) {
  const opportunities: AcademicForecastOpportunity[] = [];
  const assignmentMap = new Map(assignments.map((item) => [item.id, item]));
  for (const source of weeks.filter((week) => week.riskLevel === "HIGH" || week.riskLevel === "CRITICAL")) {
    const target = weeks.slice(0, weeks.indexOf(source)).find((week) => week.availableMinutes - week.plannedMinutes >= academicForecastConfig.getAheadMinutes);
    if (!target) continue;
    const candidates = plan.assignments.filter((entry) => {
      const item = assignmentMap.get(entry.assignmentId);
      return item?.dueAt && inWeek(item.dueAt, source) && isAssignmentActiveForPlanning(item) && entry.workType !== "exam" && entry.workType !== "quiz" && isMajorAcademicWork(entry.workType ?? "assignment") && entry.estimatedMinutes >= academicForecastConfig.getAheadMinutes;
    }).sort((left, right) => left.assignmentId.localeCompare(right.assignmentId));
    const candidate = candidates[0];
    if (!candidate) continue;
    const item = assignmentMap.get(candidate.assignmentId)!;
    const minutes = Math.min(academicForecastConfig.getAheadMinutes, candidate.estimatedMinutes);
    opportunities.push({ assignmentId: item.id, title: item.title, minutes, sourceWeekStart: source.weekStart, targetWeekStart: target.weekStart, reason: `Start ${minutes}m of ${item.title} during ${weekLabel(target)} to reduce ${weekLabel(source)} load.` });
  }
  return opportunities;
}

export function buildAcademicForecast(snapshot: SchoolSnapshot, now = new Date(), plan = buildProactivePlan(snapshot, now)): AcademicForecast {
  const horizonStart = monday(now);
  const weeks: AcademicWeekForecast[] = Array.from({ length: academicForecastConfig.horizonWeeks }, (_, index) => {
    const start = addDays(horizonStart, index * 7);
    const end = addDays(start, 6); end.setHours(23, 59, 59, 999);
    const days = plan.dailyCapacity.filter((entry) => entry.date >= start && entry.date <= end && (index > 0 || entry.date >= dayStart(now)));
    return { weekStart: start, weekEnd: end, availableMinutes: days.reduce((total, day) => total + day.capacityMinutes, 0), plannedMinutes: 0, deadlineMinutes: 0, classMinutes: classMinutes(snapshot, { weekStart: start, weekEnd: end } as AcademicWeekForecast), assignmentCount: 0, deadlineCount: 0, examCount: 0, quizCount: 0, projectCount: 0, majorWorkCount: 0, overdueCarryMinutes: 0, utilization: 0, riskLevel: "LOW", reasons: [], majorItems: [], collisions: [], opportunities: [] };
  });
  const assignments = activeAssignments(snapshot);
  for (const block of plan.workBlocks) { const week = weekFor(block.date, weeks); if (week) week.plannedMinutes += block.minutes; }
  for (const week of weeks) {
    const due = assignments.filter((item) => item.dueAt && inWeek(item.dueAt, week));
    const weekBlocks = plan.workBlocks.filter((block) => inWeek(block.date, week));
    const plannedIds = new Set(weekBlocks.map((block) => block.assignmentId));
    const relevant = assignments.filter((item) => due.some((candidate) => candidate.id === item.id) || plannedIds.has(item.id));
    week.deadlineCount = due.length;
    week.deadlineMinutes = due.reduce((total, item) => total + plan.workBlocks.filter((block) => block.assignmentId === item.id && inWeek(block.date, week)).reduce((minutes, block) => minutes + block.minutes, 0), 0);
    week.assignmentCount = new Set([...due.map((item) => item.id), ...plannedIds]).size;
    week.majorItems = [...new Set(relevant.filter((item) => isMajorAcademicWork(classifyAcademicWork(item).type)).map((item) => item.title))];
    week.projectCount = relevant.filter((item) => classifyAcademicWork(item).type === "project").length;
    week.majorWorkCount = relevant.filter((item) => isMajorAcademicWork(classifyAcademicWork(item).type)).length;
    week.overdueCarryMinutes = indexOfWeek(week, weeks) === 0 ? assignments.filter((item) => isAssignmentOverdue(item, now)).reduce((total, item) => total + minutesFor(item), 0) : 0;
    const eventItems = snapshot.events.filter((event) => inWeek(event.start, week) && (event.type === "exam" || event.type === "quiz"));
    week.examCount = eventItems.filter((event) => event.type === "exam").length;
    week.quizCount = eventItems.filter((event) => event.type === "quiz").length;
    const collisions = collisionsFor(collisionItems(snapshot, week, assignments));
    week.collisions = collisions;
    week.utilization = week.availableMinutes > 0 ? week.plannedMinutes / week.availableMinutes : 0;
    const risk = riskFor({ availableMinutes: week.availableMinutes, plannedMinutes: week.plannedMinutes, utilization: week.utilization, overdueCarryMinutes: week.overdueCarryMinutes, deadlineCount: week.deadlineCount, majorWorkCount: week.majorWorkCount, collisions });
    week.riskLevel = risk.level; week.reasons = risk.reasons;
  }
  const opportunities = opportunityFor(weeks, plan, assignments);
  for (const opportunity of opportunities) weeks.find((week) => dayKey(week.weekStart) === dayKey(opportunity.sourceWeekStart))?.opportunities.push(opportunity);
  const ranked = [...weeks].sort((left, right) => riskRank(right.riskLevel) - riskRank(left.riskLevel) || right.utilization - left.utilization || left.weekStart.getTime() - right.weekStart.getTime());
  const current = weeks[0]; const highest = ranked[0];
  const trend = weeks[1] && riskRank(weeks[1].riskLevel) > riskRank(current.riskLevel) ? "RISING" : weeks[1] && riskRank(weeks[1].riskLevel) < riskRank(current.riskLevel) ? "FALLING" : "STEADY";
  return { generatedAt: now, horizonStart, horizonEnd: weeks.at(-1)!.weekEnd, weeks, summary: { currentWeekRisk: current.riskLevel, highestRiskWeek: highest, heavyWeekCount: weeks.filter((week) => week.riskLevel === "HIGH" || week.riskLevel === "CRITICAL").length, nextMajorCollision: weeks.flatMap((week) => week.collisions).sort((left, right) => left.firstDate.getTime() - right.firstDate.getTime())[0], totalUpcomingDeadlines: assignments.filter((item) => item.dueAt && item.dueAt >= now && item.dueAt <= weeks.at(-1)!.weekEnd).length, totalUpcomingExams: snapshot.events.filter((event) => (event.type === "exam" || event.type === "quiz") && event.start >= now && event.start <= weeks.at(-1)!.weekEnd).length, getAheadOpportunityCount: opportunities.length, trend } };
}

function indexOfWeek(week: AcademicWeekForecast, weeks: AcademicWeekForecast[]) { return weeks.findIndex((candidate) => candidate === week); }
function riskRank(risk: AcademicForecastRisk) { return risk === "CRITICAL" ? 3 : risk === "HIGH" ? 2 : risk === "MODERATE" ? 1 : 0; }
