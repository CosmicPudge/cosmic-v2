"use client";

import {
  DeadlinesCard,
  DeadlinesData,
} from "@/components/school/deadlines";

const mockData: DeadlinesData = {
  summary: {
    overdue: 1,
    dueToday: 2,
    dueTomorrow: 1,
    upcoming: 2,
    completed: 2,
    totalEstimatedMinutes: 710,
    aiSummary:
      "Complete the overdue lab first, then finish today's calculus homework before moving on to longer-term projects.",
  },

  deadlines: [
    {
      id: "ee-lab-5",
      title: "Lab 5 – Op Amp Analysis",
      description:
        "Complete circuit calculations, LTspice simulation, and upload the lab report.",
      type: "lab",
      priority: "critical",
      status: "overdue",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 12),
      estimatedMinutes: 120,
      completion: 45,
      gradeWeight: 12,
      course: {
        id: "ee101",
        name: "Electrical Engineering Fundamentals",
        code: "EE 1010",
        color: "#3B82F6",
      },
      aiInsight:
        "Finish this first. It carries a high grade weight and is already overdue.",
      action: {
        label: "Open Assignment",
        href: "#",
      },
    },

    {
      id: "math-hw",
      title: "Calculus Assignment 7",
      description:
        "Complete all assigned integration practice problems.",
      type: "assignment",
      priority: "high",
      status: "due-today",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4),
      estimatedMinutes: 90,
      completion: 10,
      gradeWeight: 8,
      course: {
        id: "math1210",
        name: "Calculus I",
        code: "MATH 1210",
        color: "#10B981",
      },
      aiInsight:
        "This can be completed in a single focused study session.",
      action: {
        label: "Continue",
        href: "#",
      },
    },

    {
      id: "rotc-inspection",
      title: "AFROTC Uniform Inspection",
      description:
        "Prepare service dress and verify grooming standards before leadership lab.",
      type: "meeting",
      priority: "medium",
      status: "due-today",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 8),
      estimatedMinutes: 30,
      completion: 0,
      course: {
        id: "afrotc",
        name: "AFROTC",
        code: "AERO 101",
        color: "#60A5FA",
      },
      aiInsight:
        "Gather everything tonight so tomorrow is stress-free.",
      action: {
        label: "View Details",
        href: "#",
      },
    },

    {
      id: "physics-quiz",
      title: "Physics Quiz 2",
      description:
        "Review vectors, forces, and motion before tomorrow's quiz.",
      type: "quiz",
      priority: "high",
      status: "scheduled",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      estimatedMinutes: 75,
      completion: 25,
      gradeWeight: 10,
      course: {
        id: "phys",
        name: "Physics I",
        code: "PHYS 2210",
        color: "#F59E0B",
      },
      aiInsight:
        "A one-hour review tonight should significantly improve your score.",
      action: {
        label: "Study Guide",
        href: "#",
      },
    },

    {
      id: "design-project",
      title: "Engineering Design Proposal",
      description:
        "Finalize concept sketches and submit the initial proposal.",
      type: "project",
      priority: "medium",
      status: "upcoming",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      estimatedMinutes: 240,
      completion: 35,
      gradeWeight: 20,
      course: {
        id: "engr",
        name: "Engineering Design",
        code: "ENGR 1000",
        color: "#8B5CF6",
      },
      aiInsight:
        "Work on this in small sessions to avoid a last-minute rush.",
      action: {
        label: "Open Project",
        href: "#",
      },
    },

    {
      id: "essay-outline",
      title: "English Essay Outline",
      description:
        "Prepare your thesis and supporting outline.",
      type: "assignment",
      priority: "low",
      status: "upcoming",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8),
      estimatedMinutes: 60,
      completion: 0,
      gradeWeight: 5,
      course: {
        id: "engl",
        name: "English Composition",
        code: "ENGL 1010",
        color: "#EC4899",
      },
      action: {
        label: "Start Writing",
        href: "#",
      },
    },

    {
      id: "history-reading",
      title: "History Reading",
      description:
        "Read Chapters 3–4 and submit discussion notes.",
      type: "reading",
      priority: "low",
      status: "completed",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      estimatedMinutes: 50,
      completion: 100,
      gradeWeight: 3,
      course: {
        id: "hist",
        name: "US History",
        code: "HIST 1700",
        color: "#A78BFA",
      },
    },

    {
      id: "chem-prelab",
      title: "Chemistry Pre-Lab",
      description:
        "Complete safety questions and experiment preparation.",
      type: "lab",
      priority: "medium",
      status: "completed",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
      estimatedMinutes: 45,
      completion: 100,
      gradeWeight: 5,
      course: {
        id: "chem",
        name: "General Chemistry",
        code: "CHEM 1210",
        color: "#22C55E",
      },
    },
  ],
};

export default function DeadlinesDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-10">
      <div className="mx-auto max-w-7xl">
        <DeadlinesCard data={mockData} />
      </div>
    </main>
  );
}