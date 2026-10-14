"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Megaphone,
  TrendingUp,
} from "lucide-react";

import AppHeader from "@/components/os/app/AppHeader";
import CosmicCard from "@/design-system/components/CosmicCard";
import StatusChip from "@/components/os/ui/StatusChip";
import SchoolTabs from "@/components/school/SchoolTabs";
import FoundationSurfaceToggle from "@/components/os/ui/FoundationSurfaceToggle";
import FoundationViewportIndicator from "@/components/os/ui/FoundationViewportIndicator";
import Skeleton from "@/components/os/ui/Skeleton";
import { useSchool } from "@/components/school/context/SchoolDataContext";
import { getWeeklySchedule } from "@/components/school/data/weeklySchedule";



function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function dueWithin(date: Date, days: number, now: number) {
  const time = date.getTime();
  return time >= now && time <= now + days * 86_400_000;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  loading,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof GraduationCap;
  loading?: boolean;
  href: string;
}) {
  return (
    <Link href={href} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-violet-300">
    <CosmicCard className="h-full p-5 transition-colors hover:border-violet-300/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{label}</p>
          {loading ? <Skeleton className="mt-3 h-7 w-24 rounded-md" /> : <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>}
          {loading ? <Skeleton className="mt-3 h-4 w-32 rounded-md" /> : <p className="mt-1 text-sm text-white/45">{detail}</p>}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/[0.08] text-violet-100">
          <Icon size={20} />
        </div>
      </div>
    </CosmicCard>
    </Link>
  );
}

export default function CosmosSchoolOverview({ preview = false }: { preview?: boolean }) {
  const { data, snapshot, local, loading, error } = useSchool();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const term = local.data.terms.find((item) => item.active) ?? local.data.terms[0];
  const courses = useMemo(
    () => local.data.courses.filter((course) => !term || course.termId === term.id),
    [local.data.courses, term],
  );
  const credits = courses.reduce((sum, course) => sum + (course.credits ?? 0), 0);
  const recordedGrades = local.data.grades.filter((grade) => courses.some((course) => course.id === grade.courseId));
  const gradePoints: Record<string, number> = { "A+":4, A:4, "A-":3.7, "B+":3.3, B:3, "B-":2.7, "C+":2.3, C:2, "C-":1.7, "D+":1.3, D:1, "D-":0.7, F:0 };
  const gradedCourses = courses.flatMap((course) => { const grade = [...recordedGrades].reverse().find((item) => item.courseId === course.id && item.letter && gradePoints[item.letter.toUpperCase()] !== undefined); return grade ? [{ credits: course.credits ?? 0, points: gradePoints[grade.letter!.toUpperCase()] }] : []; });
  const gradedCredits = gradedCourses.reduce((sum, grade) => sum + grade.credits, 0);
  const manualGpa = gradedCredits > 0 ? gradedCourses.reduce((sum, grade) => sum + grade.credits * grade.points, 0) / gradedCredits : undefined;

  const assignments = useMemo(() => {
    const remote = data?.assignments ?? [];
    const localAssignments = local.data.assignments.map((item) => ({
      id: item.id,
      title: item.title,
      due: item.dueAt ?? new Date(8640000000000000),
      course: courses.find((course) => course.id === item.courseId)?.code,
      completed: item.status === "completed",
      priority: item.priority,
    }));
    const merged = [...remote, ...localAssignments];
    return [...new Map(merged.map((item) => [item.id, item])).values()];
  }, [courses, data?.assignments, local.data.assignments]);

  const openAssignments = assignments
    .filter((item) => !item.completed)
    .sort((a, b) => a.due.getTime() - b.due.getTime());
  const dueSoon = openAssignments.filter((item) => dueWithin(item.due, 7, now)).length;

  const manualSchedule = getWeeklySchedule(courses, term, new Date(now));
  const todayClasses = manualSchedule.filter((item) => item.start.toDateString() === new Date(now).toDateString()).map((item) => ({ id: `${item.course.id}-${item.start.toISOString()}`, name: item.course.code || item.course.name, start: item.start, end: item.end, location: item.location }));
  const nextClass = manualSchedule.find((item) => item.end.getTime() > now);

  const workload = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    const count = openAssignments.filter((item) => item.due >= date && item.due < end).length;
    return { label: date.toLocaleDateString([], { weekday: "short" }), count };
  });
  const maxWorkload = Math.max(1, ...workload.map((item) => item.count));

  const gpa = manualGpa;
  const providerHealthy = !error && snapshot?.sourceStatus?.canvas !== "error";
  const sourceLabel = snapshot?.sourceStatus?.canvas === "healthy" ? "Canvas calendar active" : snapshot?.sourceStatus?.canvas === "error" ? "Canvas calendar unavailable" : "Manual data + optional Canvas calendar";

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <AppHeader
        eyebrow={term ? `School · ${term.name}` : "School"}
        title="School"
        subtitle="Your classes, assignments, and academic tools."
        rightContent={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {preview ? <FoundationViewportIndicator /> : null}
            {preview ? <FoundationSurfaceToggle /> : null}
            {preview ? <StatusChip variant="primary">Milestone 2 preview</StatusChip> : null}
            <label className="flex items-center gap-2 text-sm text-white/70"><span className="sr-only">Academic term</span><select aria-label="Academic term" value={term?.id ?? ""} onChange={(event) => local.setActiveTerm(event.target.value)} className="rounded-xl border border-violet-300/30 bg-[#130b2d]/80 px-3 py-2 text-white"><option value="" disabled>{term ? "Select term" : "No term yet"}</option>{local.data.terms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <StatusChip variant={providerHealthy ? "success" : "warning"}>{sourceLabel}</StatusChip>
          </div>
        }
      />

      <SchoolTabs />

      {local.ready && !local.data.terms.length ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-violet-300/30 bg-violet-900/20 p-4 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold text-white">Set up your School workspace</p><p className="mt-1 text-white/60">Create an academic term first, then add courses, meeting times, and grades. Canvas Calendar can supply assignment deadlines separately.</p></div>
          <Link href="/school/settings" className="shrink-0 rounded-xl border border-violet-300/40 px-4 py-2 text-center font-medium text-white hover:bg-violet-300/10">Create term</Link>
        </div>
      ) : null}


      {error ? (
        <div role="status" className="mb-5 rounded-xl border border-amber-300/15 bg-amber-400/[0.05] px-4 py-3 text-sm text-amber-50/75">
          Some connected School data is unavailable. Local academic data is still shown where possible.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current GPA" value={gpa !== undefined ? gpa.toFixed(2) : "—"} detail={gpa !== undefined ? "Calculated from manually entered letter grades" : "Enter course grades to calculate GPA"} icon={TrendingUp} href="/school/grades" loading={loading && !data} />
        <MetricCard label="Next class" value={nextClass ? (nextClass.start.getTime() <= now ? "In class" : formatTime(nextClass.start)) : "Clear"} detail={nextClass ? (nextClass.course.code || nextClass.course.name) : "Add weekly meetings to your courses"} icon={Clock3} href="/school/schedule" loading={loading && !data} />
        <MetricCard label="Due soon" value={String(dueSoon)} detail="Canvas calendar + manually entered assignments" icon={CheckCircle2} href="/school/assignments" loading={loading && !data} />
        <MetricCard label="Credits" value={String(credits)} detail={term ? `Enrolled credits · ${term.name}` : "Add courses to track credits"} icon={GraduationCap} href="/school/courses" loading={!local.ready} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="min-w-0"><CosmicCard className="overflow-hidden h-full">
          <div className="flex items-end justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/55">Today</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Today&apos;s classes</h2>
            </div>
            <Link href="/school/calendar" className="text-sm text-cyan-100/65 hover:text-white">Full schedule</Link>
          </div>

          {!local.ready ? (
            <div className="space-y-2 px-5 pb-5 sm:px-6"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
          ) : todayClasses.length ? todayClasses.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-t border-white/[0.07] px-5 py-4 sm:px-6">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/[0.07] text-cyan-100"><BookOpen size={17} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/85">{item.name}</p>
                <p className="mt-1 truncate text-xs text-white/40">{item.location || "Location unavailable"}</p>
              </div>
              <span className="shrink-0 text-xs text-white/55">{formatTime(item.start)}–{formatTime(item.end)}</span>
            </div>
          )) : (
            <p className="border-t border-white/[0.07] px-5 py-6 text-sm text-white/45 sm:px-6">No classes scheduled today. Add meeting times under Courses.</p>
          )}
        </CosmicCard></div>
        <div className="min-w-0"><CosmicCard className="overflow-hidden h-full">
          <div className="flex items-end justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/50">Assignments</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Upcoming assignments</h2>
            </div>
            <Link href="/school/assignments" className="text-sm text-cyan-100/65 hover:text-white">View all</Link>
          </div>
          {openAssignments.slice(0, 6).map((item) => (
            <Link key={item.id} href={`/school/assignments/${encodeURIComponent(item.id)}`} className="group flex items-center gap-3 border-t border-white/[0.07] px-5 py-4 transition hover:bg-white/[0.025] sm:px-6">
              <CheckCircle2 size={17} className="shrink-0 text-violet-100/65" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/85">{item.title}</p>
                <p className="mt-1 truncate text-xs text-white/40">{item.course || "Course"} · {item.priority} priority</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-white/60">{formatDate(item.due)}</p>
                <p className="mt-1 text-[10px] text-white/35">{formatTime(item.due)}</p>
              </div>
              <ArrowUpRight size={15} className="text-white/20 transition group-hover:text-white/60" />
            </Link>
          ))}
          {!openAssignments.length ? <p className="border-t border-white/[0.07] px-5 py-6 text-sm text-white/45 sm:px-6">No assignments yet. Connect your Canvas calendar or add assignments manually.</p> : null}
        </CosmicCard></div>
        <div className="min-w-0"><CosmicCard className="p-5 sm:p-6 h-full">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/50">Next 7 days</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Weekly workload</h2>
            </div>
            <CalendarDays size={20} className="text-fuchsia-100/70" />
          </div>
          <p className="mt-2 text-xs text-white/45">Assignment deadlines per day · not recorded study time</p>
          <div className="mt-6 grid grid-cols-7 gap-2">
            {workload.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end rounded-lg border border-white/[0.06] bg-white/[0.025] p-1">
                  <div className="w-full rounded-md bg-gradient-to-t from-violet-500/75 to-cyan-300/65" style={{ height: `${Math.max(8, (item.count / maxWorkload) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-white/35">{item.label}</span>
                <span className="text-xs font-semibold tabular-nums text-white/65">{item.count}</span>
              </div>
            ))}
          </div>
        </CosmicCard></div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="min-w-0"><CosmicCard className="overflow-hidden h-full">
          <div className="flex items-end justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/50">Courses</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Current courses</h2>
            </div>
            <Link href="/school/courses" className="text-sm text-cyan-100/65 hover:text-white">Courses</Link>
          </div>
          {courses.length ? (
            <div className="grid gap-3 border-t border-white/[0.07] p-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((course, index) => {
                const related = openAssignments.filter((item) => item.course && (item.course === course.code || item.course === course.name)).length;
                const grade = [...recordedGrades].reverse().find((item) => item.courseId === course.id && item.letter);
                const next = manualSchedule.find((item) => item.course.id === course.id && item.end.getTime() > now);
                return <Link key={course.id} href={`/school/courses/${encodeURIComponent(course.id)}`} className="group min-w-0 overflow-hidden rounded-xl border border-violet-300/20 bg-violet-950/20 transition hover:border-violet-300/50">
                  <div className="relative flex h-20 items-end overflow-hidden bg-gradient-to-br from-indigo-900/65 via-violet-700/30 to-fuchsia-950/40 p-3">
                    <span className="absolute right-3 top-2 text-4xl font-black text-white/[0.06]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="relative truncate text-sm font-semibold text-white">{course.code || course.name}</span>
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="truncate text-xs text-white/60" title={course.name}>{course.name}</p>
                    <div className="flex items-center justify-between gap-2 text-xs"><span className="font-semibold text-violet-100">{grade?.letter ? `Grade ${grade.letter}` : "Grade not entered"}</span><span className="text-white/50">{course.credits ?? "—"} cr</span></div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-white/45"><span>{related} pending assignments</span><span className="truncate">{next ? formatDate(next.start) : "No meeting"}</span></div>
                  </div>
                </Link>;
              })}
            </div>
          ) : null}
          {!courses.length ? <p className="border-t border-white/[0.07] px-5 py-6 text-sm text-white/45 sm:px-6">No courses saved yet. Add courses manually from the Courses tab.</p> : null}
        </CosmicCard></div>
        <div className="min-w-0"><CosmicCard className="overflow-hidden h-full">
        <div className="flex items-end justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/50">Feedback & announcements</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Latest updates</h2>
          </div>
          <Megaphone size={20} className="text-amber-100/65" />
        </div>
        {(data?.announcements ?? []).slice(0, 4).map((announcement) => (
          <div key={announcement.id} className="border-t border-white/[0.07] px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-white/85">{announcement.title}</p>
              <span className="text-xs text-white/35">{formatDate(announcement.date)}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/45">{announcement.body}</p>
          </div>
        ))}
        {!data?.announcements?.length ? <p className="border-t border-white/[0.07] px-5 py-6 text-sm text-white/45 sm:px-6">No recent announcements available. Feedback must be entered manually.</p> : null}
      </CosmicCard></div>
      </div>

    </div>
  );
}
