"use client";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CloudLightning,
  Dumbbell,
  Mail,
} from "lucide-react";

import {
  PriorityCard,
  type PriorityData,
} from "@/components/school/priority";

const data: PriorityData = {
  recommendation: {
    title: "Complete Calculus before PT",
    description:
      "Your Calculus assignment has the highest urgency and requires the most focus. Finish it before your AFROTC PT assessment tomorrow morning while weather conditions are still favorable.",
  },

  priorities: [
    {
      id: "calc-homework",
      title: "Finish Calculus Assignment",
      subtitle: "Chapter 6 Derivatives",
      source: "academics",
      level: "critical",
      status: "pending",
      score: 98,
      dueAt: new Date("2026-07-23T12:00:00"),
      icon: BookOpen,
      color: "#EF4444",
    },

    {
      id: "pt-test",
      title: "AFROTC PT Assessment",
      subtitle: "0600 at the Track",
      source: "afrotc",
      level: "high",
      status: "pending",
      score: 90,
      dueAt: new Date("2026-07-23T12:00:00"),
      icon: Dumbbell,
      color: "#F97316",
    },

    {
      id: "prof-email",
      title: "Reply to Professor",
      subtitle: "Unread email about Lab",
      source: "notifications",
      level: "medium",
      status: "pending",
      score: 62,
      icon: Mail,
      color: "#3B82F6",
    },

    {
      id: "team-meeting",
      title: "Engineering Team Meeting",
      subtitle: "Design Review",
      source: "calendar",
      level: "medium",
      status: "pending",
      score: 58,
      dueAt: new Date("2026-07-23T12:00:00"),
      icon: CalendarDays,
      color: "#A855F7",
    },

    {
      id: "storm-warning",
      title: "Thunderstorms Expected",
      subtitle: "Leave campus early",
      source: "weather",
      level: "low",
      status: "pending",
      score: 25,
      dueAt: new Date("2026-07-23T12:00:00"),
      icon: CloudLightning,
      color: "#06B6D4",
    },

    {
      id: "lab-report",
      title: "Physics Lab Report",
      subtitle: "Submitted Successfully",
      source: "academics",
      level: "complete",
      status: "completed",
      completed: true,
      score: 0,
      icon: CheckCircle2,
      color: "#22C55E",
    },
  ],
};

export default function PriorityDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <PriorityCard data={data} />
      </div>
    </main>
  );
}