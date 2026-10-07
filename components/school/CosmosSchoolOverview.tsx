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
import Skeleton from "@/components/os/ui/Skeleton";
import { useSchool } from "@/components/school/context/SchoolDataContext";



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
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof GraduationCap;
  loading?: boolean;
}) {
  return (
    <CosmicCard className="p-5">
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

  const todayClasses = (data?.classes ?? [])
    .filter((item) => item.start.toDateString() === new Date(now).toDateString())
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const nextClass = (data?.classes ?? [])
    .filter((item) => item.start.getTime() >= now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

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

  const gpa = data?.stats.gpa;
  const providerHealthy = !error && snapshot?.sourceStatus?.canvas !== "error";
  const sourceLabel = snapshot?.sourceStatus?.canvas === "healthy" ? "Canvas connected" : snapshot?.sourceStatus?.canvas === "error" ? "Canvas issue" : "Local + calendar data";

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <AppHeader
        eyebrow={term ? `School · ${term.name}` : "School"}
        title="School"
        subtitle="Courses, assignments, schedule, progress, and feedback in one academic command center."
        rightContent={
          <div className="flex flex-wrap items-center gap-2">
            {preview ? <StatusChip variant="primary">Milestone 2 preview</StatusChip> : null}
            <StatusChip variant={providerHealthy ? "success" : "warning"}>{sourceLabel}</StatusChip>
          </div>
        }
      />

      <SchoolTabs />

      {error ? (
        <div role="status" className="mb-5 rounded-xl border border-amber-300/15 bg-amber-400/[0.05] px-4 py-3 text-sm text-amber-50/75">
          Some connected School data is unavailable. Local academic data is still shown where possible.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current GPA" value={gpa !== undefined ? gpa.toFixed(2) : "—"} detail={gpa !== undefined ? "Current academic snapshot" : "Grade data not available"} icon={TrendingUp} loading={loading && !data} />
        <MetricCard label="Next class" value={nextClass ? formatTime(nextClass.start) : "Clear"} detail={nextClass ? nextClass.name : "No upcoming class found"} icon={Clock3} loading={loading && !data} />
        <MetricCard label="Due soon" value={String(dueSoon)} detail="Assignments due in the next 7 days" icon={CheckCircle2} loading={loading && !data} />
        <MetricCard label="Credits" value={String(credits)} detail={term ? `Tracked for ${term.name}` : "Current tracked courses"} icon={GraduationCap} loading={!local.ready} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <CosmicCard className="overflow-hidden">
          <div className="flex items-end justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/55">Today</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Today&apos;s classes</h2>
            </div>
            <Link href="/school/calendar" className="text-sm text-cyan-100/65 hover:text-white">Open calendar</Link>
          </div>

          {loading && !data ? (
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
            <p className="border-t border-white/[0.07] px-5 py-6 text-sm text-white/45 sm:px-6">No classes are scheduled for today.</p>
          )}
        </CosmicCard>

        <CosmicCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/50">Next 7 days</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Weekly workload</h2>
            </div>
            <CalendarDays size={20} className="text-fuchsia-100/70" />
          </div>
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
        </CosmicCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <CosmicCard className="overflow-hidden">
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
          {!openAssignments.length ? <p className="border-t border-white/[0.07] px-5 py-6 text-sm text-white/45 sm:px-6">No open assignments found.</p> : null}
        </CosmicCard>

        <CosmicCard className="overflow-hidden">
          <div className="flex items-end justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/50">Courses</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Current courses</h2>
            </div>
            <Link href="/school/courses" className="text-sm text-cyan-100/65 hover:text-white">Courses</Link>
          </div>
          {courses.slice(0, 6).map((course) => (
            <Link key={course.id} href={`/school/courses/${encodeURIComponent(course.id)}`} className="group flex items-center gap-3 border-t border-white/[0.07] px-5 py-4 transition hover:bg-white/[0.025] sm:px-6">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-cyan-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/85">{course.code || course.name}</p>
                <p className="mt-1 truncate text-xs text-white/40">{course.code ? course.name : course.instructor || "Course details"}</p>
              </div>
              <span className="text-xs text-white/40">{course.credits ? `${course.credits} cr` : ""}</span>
              <ArrowUpRight size={15} className="text-white/20 transition group-hover:text-white/60" />
            </Link>
          ))}
          {!courses.length ? <p className="border-t border-white/[0.07] px-5 py-6 text-sm text-white/45 sm:px-6">No current courses are saved yet.</p> : null}
        </CosmicCard>
      </div>

      <CosmicCard className="mt-4 overflow-hidden">
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
        {!data?.announcements?.length ? <p className="border-t border-white/[0.07] px-5 py-6 text-sm text-white/45 sm:px-6">No recent announcements are available.</p> : null}
      </CosmicCard>
    </div>
  );
}
