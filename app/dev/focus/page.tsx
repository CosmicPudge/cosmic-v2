"use client";

import { FocusCard } from "@/components/school/focus";
import { FocusData } from "@/components/school/focus";

const focusData: FocusData = {
  mission: {
    title: "Finish EE245 Lab",
    subtitle: "This has the biggest impact on today's workload.",
    description:
      "Completing this assignment today keeps you ahead of schedule and frees up tomorrow for Calculus review.",
    priority: "high",
    progress: 42,
    estimatedMinutes: 95,
    dueText: "Today • 11:59 PM",
    action: {
      label: "Continue Working",
    },
  },

  tasks: [
    {
      id: "1",
      title: "Physics Chapter 5 Review",
      description: "Review electric fields before tomorrow's lecture.",
      category: "study",
      priority: "medium",
      status: "not-started",
      dueText: "Tomorrow",
      estimatedMinutes: 45,
      progress: 0,
      action: {
        label: "Open",
      },
    },

    {
      id: "2",
      title: "Calculus Homework",
      description: "Finish problems 12–28.",
      category: "assignment",
      priority: "high",
      status: "in-progress",
      dueText: "Thursday",
      estimatedMinutes: 60,
      progress: 55,
      action: {
        label: "Continue",
      },
    },

    {
      id: "3",
      title: "AFROTC Leadership Lab",
      description: "Prepare uniform and leadership notes.",
      category: "afrotc",
      priority: "medium",
      status: "not-started",
      dueText: "Tonight • 6:00 PM",
      estimatedMinutes: 20,
      progress: 0,
      action: {
        label: "Review",
      },
    },
  ],

  progress: {
    completedTasks: 5,
    totalTasks: 8,
    completedMinutes: 148,
    targetMinutes: 240,
    completionPercent: 62,
  },
};

export default function FocusDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-10">
      <div className="mx-auto max-w-5xl">
        <FocusCard data={focusData} />
      </div>
    </main>
  );
}