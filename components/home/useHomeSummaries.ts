"use client";

import { useEffect, useMemo, useState } from "react";

import { useSchoolData } from "@/components/school/hooks/useSchoolData";
import { useFinanceRepository } from "@/services/finance/localRepository";
import { calculateAccountBalance, formatMoney, getUpcomingRecurringItems } from "@/services/finance/domain";
import { getUnifiedAccountTotals, mergeFinanceAccounts } from "@/services/finance/merged";
import { useConnectedFinanceData } from "@/components/apps/finance/useConnectedFinanceData";
import useCalendar from "@/hooks/os/useCalendar";
import { useGarage } from "@/hooks/os/useGarage";
import { useSports } from "@/hooks/os/useSports";
import { useProjects } from "@/hooks/os/useProjects";
import { useNotes } from "@/hooks/os/useNotes";
import { useMusic } from "@/hooks/os/useMusic";

export type HomeSummaryState = "loading" | "ready" | "empty" | "error";

export interface HomeSummary {
  value: string;
  detail: string;
  state: HomeSummaryState;
}

function timeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dueWithin(date: Date, days: number, now: number) {
  const time = date.getTime();
  return time >= now && time <= now + days * 86_400_000;
}

export function useHomeSummaries() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const school = useSchoolData();
  const calendar = useCalendar();
  const finance = useFinanceRepository();
  const connectedFinance = useConnectedFinanceData(25);
  const garage = useGarage();
  const sports = useSports();
  const projects = useProjects();
  const notes = useNotes();
  const music = useMusic();

  const schoolSummary = useMemo<HomeSummary>(() => {
    if (school.loading && !school.data) return { value: "Loading", detail: "Checking classes and assignments", state: "loading" };
    if (school.error && !school.data) return { value: "Unavailable", detail: school.error, state: "error" };
    if (!school.data) return { value: "No school data", detail: "Open School to connect an academic source", state: "empty" };

    const nextClass = school.data.classes
      .filter((item) => item.start.getTime() > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    const dueSoon = school.data.assignments.filter((item) => !item.completed && dueWithin(item.due, 7, now)).length;
    const gpa = school.data.stats.gpa;

    return {
      value: gpa !== undefined ? `${gpa.toFixed(2)} GPA` : `${dueSoon} due soon`,
      detail: nextClass ? `${dueSoon} due soon · next class ${timeLabel(nextClass.start)}` : dueSoon ? `${dueSoon} assignment${dueSoon === 1 ? "" : "s"} due this week` : "Schedule is clear",
      state: "ready",
    };
  }, [now, school.data, school.error, school.loading]);

  const calendarSummary = useMemo<HomeSummary>(() => {
    if (calendar.loading && !calendar.calendar) return { value: "Loading", detail: "Checking today's schedule", state: "loading" };
    if (calendar.error && !calendar.calendar) return { value: "Unavailable", detail: calendar.error, state: "error" };
    if (!calendar.calendar) return { value: "No calendar data", detail: "Open Calendar to connect a source", state: "empty" };
    const today = calendar.calendar.today.length;
    const next = calendar.calendar.nextEvent;
    return {
      value: `${today} event${today === 1 ? "" : "s"} today`,
      detail: next ? `Next · ${next.title} at ${timeLabel(next.start)}` : "Nothing else scheduled today",
      state: "ready",
    };
  }, [calendar.calendar, calendar.error, calendar.loading]);

  const financeSummary = useMemo<HomeSummary>(() => {
    if (!finance.ready || connectedFinance.loading) return { value: "Loading", detail: "Calculating your spending guardrail", state: "loading" };

    const balances = new Map(finance.data.accounts.map((account) => [account.id, calculateAccountBalance(account, finance.data.transactions)]));
    const accounts = mergeFinanceAccounts(finance.data.accounts, connectedFinance.accounts, balances);
    if (!accounts.length) return { value: "No accounts", detail: "Open Finance to connect or add an account", state: "empty" };

    const totals = getUnifiedAccountTotals(accounts);
    const protectedSavings = accounts
      .filter((account) => account.type === "savings")
      .reduce((sum, account) => sum + Math.max(0, account.availableBalanceMinor ?? account.currentBalanceMinor), 0);
    const reservedBills = getUpcomingRecurringItems(finance.data.recurringItems, new Date(), 30)
      .filter((item) => item.direction === "expense" || (item.direction === "transfer" && item.transferEffect === "out"))
      .reduce((sum, item) => sum + item.amountMinor, 0);
    const safeMinor = Math.max(0, totals.availableCashMinor - protectedSavings - reservedBills);

    return {
      value: `${formatMoney(safeMinor, finance.data.hideBalances)} safe to spend`,
      detail: reservedBills || protectedSavings
        ? `${formatMoney(reservedBills, finance.data.hideBalances)} bills · ${formatMoney(protectedSavings, finance.data.hideBalances)} protected`
        : "Available cash after current protections",
      state: "ready",
    };
  }, [connectedFinance.accounts, connectedFinance.loading, finance.data, finance.ready]);

  const garageSummary = useMemo<HomeSummary>(() => {
    if (garage.loading) return { value: "Loading", detail: "Checking your garage", state: "loading" };
    if (!garage.selectedVehicle || !garage.summary) return { value: "No vehicle", detail: "Open Garage to add a vehicle", state: "empty" };
    const maintenance = garage.summary.maintenance.filter((item) => ["overdue", "dueSoon"].includes(garage.summary!.statusById.get(item.id) ?? "")).length;
    const openIssues = garage.summary.issues.filter((item) => item.status !== "resolved").length;
    return {
      value: `${garage.summary.currentMileage.toLocaleString()} mi`,
      detail: maintenance || openIssues ? `${maintenance} maintenance · ${openIssues} open issue${openIssues === 1 ? "" : "s"}` : `${garage.selectedVehicle.nickname} · all clear`,
      state: "ready",
    };
  }, [garage.loading, garage.selectedVehicle, garage.summary]);

  const sportsSummary = useMemo<HomeSummary>(() => {
    if (sports.loading && !sports.data) return { value: "Loading", detail: "Checking watched teams and races", state: "loading" };
    if (sports.error && !sports.data) return { value: "Unavailable", detail: sports.error, state: "error" };
    if (!sports.data) return { value: "No sports data", detail: "Scores and schedules will appear here", state: "empty" };
    const live = sports.data.live.length;
    const upcoming = sports.data.upcoming.length;
    const event = sports.data.live[0] ?? sports.data.upcoming[0];
    return {
      value: live ? `${live} live now` : `${upcoming} upcoming`,
      detail: event ? event.title : "No followed events coming up",
      state: "ready",
    };
  }, [sports.data, sports.error, sports.loading]);

  const projectsSummary = useMemo<HomeSummary>(() => {
    if (projects.loading) return { value: "Loading", detail: "Checking active projects", state: "loading" };
    const active = projects.data.projects.filter((project) => project.status === "active");
    if (!active.length) return { value: "No active projects", detail: "Open Projects to start one", state: "empty" };
    const project = active[0];
    const projectTasks = projects.data.tasks.filter((task) => task.projectId === project.id);
    const completed = projectTasks.filter((task) => task.completed).length;
    const progress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;
    return {
      value: `${active.length} active`,
      detail: `${project.title} · ${projectTasks.length ? `${progress}% complete` : "no tasks yet"}`,
      state: "ready",
    };
  }, [projects.data.projects, projects.data.tasks, projects.loading]);

  const notesSummary = useMemo<HomeSummary>(() => {
    if (notes.loading) return { value: "Loading", detail: "Opening your brain", state: "loading" };
    const visible = notes.notes.filter((note) => !note.archived);
    if (!visible.length) return { value: "No notes yet", detail: "Capture your first idea", state: "empty" };
    return {
      value: `${visible.length} note${visible.length === 1 ? "" : "s"}`,
      detail: `Recent · ${visible[0].title || "Untitled Note"}`,
      state: "ready",
    };
  }, [notes.loading, notes.notes]);

  const mediaSummary = useMemo<HomeSummary>(() => {
    if (music.loading && !music.playback) return { value: "Loading", detail: "Checking media playback", state: "loading" };
    if (music.error && !music.playback) return { value: "Unavailable", detail: music.error, state: "error" };
    const track = music.playback?.track;
    if (!track) return { value: "Nothing playing", detail: music.connected ? "Media is ready when playback starts" : "Open Media to connect a provider", state: "empty" };
    return {
      value: music.playback?.playing ? "Now playing" : "Paused",
      detail: `${track.title}${track.artists?.length ? ` · ${track.artists.join(", ")}` : ""}`,
      state: "ready",
    };
  }, [music.connected, music.error, music.loading, music.playback]);

  return {
    school: schoolSummary,
    calendar: calendarSummary,
    finance: financeSummary,
    garage: garageSummary,
    sports: sportsSummary,
    projects: projectsSummary,
    notes: notesSummary,
    media: mediaSummary,
    tasks: { value: "Not connected yet", detail: "Task data arrives with the Tasks milestone", state: "empty" } satisfies HomeSummary,
    health: { value: "Not connected yet", detail: "Health data arrives with the Health milestone", state: "empty" } satisfies HomeSummary,
  };
}
