"use client";

import {
  CoachCard,
  CoachData,
} from "@/components/school/aicoach";

const mockData: CoachData = {
  summary: {
    productivityScore: 91,
    tasksRemaining: 5,
    estimatedMinutesRemaining: 435,
    completedToday: 3,
    aiSummary:
      "You're on track to finish everything today if you begin your EE lab now.",
  },

  mission: {
    title: "Complete your highest-impact coursework before class.",
    subtitle:
      "Focus on assignments with the greatest grade impact while avoiding last-minute work.",
    confidence: 91,
  },

  recommendation: {
    title: "Finish the EE Lab First",
    reason:
      "Your Op Amp lab is overdue, worth 12% of your grade, and blocks progress on upcoming coursework. Completing it now gives you the biggest academic benefit.",
    confidence: 91,
    estimatedCompletionTime: "7:45 PM",
  },

  insights: [
    {
      id: "warning",
      type: "warning",
      title: "Physics Quiz Tomorrow",
      message:
        "You haven't reviewed for tomorrow's Physics quiz. Even a one-hour review tonight should significantly improve your score.",
      priority: "high",
    },

    {
      id: "recommendation",
      type: "recommendation",
      title: "Prioritize EE Before Calculus",
      message:
        "The EE lab has a larger grade impact than today's Calculus assignment. Completing it first reduces your academic risk.",
      priority: "critical",
    },

    {
      id: "schedule",
      type: "schedule",
      title: "Two-Hour Study Window",
      message:
        "You have an open block between classes this afternoon that's ideal for focused work.",
      priority: "medium",
    },

    {
      id: "achievement",
      type: "achievement",
      title: "Great Momentum",
      message:
        "You've completed three assignments ahead of schedule this week. Keep the streak going.",
      priority: "low",
    },
  ],

  tasks: [
    {
      id: "ee-lab",
      title: "Lab 5 – Op Amp Analysis",
      description:
        "Complete calculations, LTspice simulation, and submit the report.",
      priority: "critical",
      estimatedMinutes: 120,
      completed: false,
      category: "assignment",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2),
      course: {
        id: "ee101",
        code: "EE 1010",
        name: "Electrical Engineering Fundamentals",
        color: "#3B82F6",
      },
    },

    {
      id: "calc",
      title: "Calculus Assignment 7",
      description:
        "Finish the integration practice problems before midnight.",
      priority: "high",
      estimatedMinutes: 90,
      completed: false,
      category: "assignment",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 6),
      course: {
        id: "math1210",
        code: "MATH 1210",
        name: "Calculus I",
        color: "#10B981",
      },
    },

    {
      id: "rotc",
      title: "Prepare AFROTC Uniform",
      description:
        "Inspect service dress and prepare everything for leadership lab.",
      priority: "medium",
      estimatedMinutes: 30,
      completed: false,
      category: "meeting",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 10),
      course: {
        id: "afrotc",
        code: "AERO 101",
        name: "AFROTC",
        color: "#60A5FA",
      },
    },

    {
      id: "physics",
      title: "Review Physics Quiz",
      description:
        "Review vectors, forces, and motion before tomorrow's quiz.",
      priority: "medium",
      estimatedMinutes: 75,
      completed: false,
      category: "study",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      course: {
        id: "phys",
        code: "PHYS 2210",
        name: "Physics I",
        color: "#F59E0B",
      },
    },

    {
      id: "design",
      title: "Engineering Design Proposal",
      description:
        "Finalize concept sketches for the first project milestone.",
      priority: "low",
      estimatedMinutes: 120,
      completed: false,
      category: "assignment",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      course: {
        id: "engr",
        code: "ENGR 1000",
        name: "Engineering Design",
        color: "#8B5CF6",
      },
    },

    {
      id: "history",
      title: "History Reading",
      description:
        "Read Chapters 3–4 and submit discussion notes.",
      priority: "low",
      estimatedMinutes: 45,
      completed: true,
      category: "study",
      course: {
        id: "hist",
        code: "HIST 1700",
        name: "US History",
        color: "#A78BFA",
      },
    },

    {
      id: "chem",
      title: "Chemistry Pre-Lab",
      description:
        "Complete safety questions before tomorrow's experiment.",
      priority: "medium",
      estimatedMinutes: 45,
      completed: true,
      category: "assignment",
      course: {
        id: "chem",
        code: "CHEM 1210",
        name: "General Chemistry",
        color: "#22C55E",
      },
    },

    {
      id: "email",
      title: "Reply to Professor",
      description:
        "Respond to the project clarification email.",
      priority: "low",
      estimatedMinutes: 15,
      completed: true,
      category: "personal",
    },
  ],
};

export default function AICoachDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-10">
      <div className="mx-auto max-w-7xl">
        <CoachCard data={mockData} />
      </div>
    </main>
  );
}