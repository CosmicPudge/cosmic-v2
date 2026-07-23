import type { SchoolDashboardData } from "./dashboardTypes";

export const dashboardMockData: SchoolDashboardData = {
greeting: {
  period: "afternoon",
  title: "Good afternoon, Stetson!",
  subtitle: "You're doing great. Keep the momentum going today.",
},

overview: {
  location: "Logan, Utah",
  temperature: 84,
  condition: "Sunny",

  nextClass: "Calculus II",
  nextClassTime: "1:30 PM",

  todaysClasses: 4,
},

academics: {
  semester: {
    gpa: 3.87,
    average: 94.6,

    creditsCompleted: 38,
    creditsTotal: 122,

    standing: "excellent",

    scholarshipEligible: true,

    totalAssignments: 58,
    completedAssignments: 47,
    missingAssignments: 2,

    aiSummary:
      "Excellent semester. Your Engineering and AFROTC courses continue to outperform expectations. Focus on Physics to maintain a strong GPA.",
  },

  courses: [
    {
      id: "engr1010",
      code: "ENGR 1010",
      name: "Introduction to Engineering",

      credits: 3,

      color: "#3B82F6",

      instructor: {
        name: "Dr. Wilson",
        email: "wilson@usu.edu",
        office: "Engineering 302",
      },

      status: "active",

      grade: {
        letter: "A",
        percentage: 96.4,
        points: 4.0,
      },

      assignments: {
        completed: 14,
        total: 16,
        missing: 0,
      },

      attendance: 99,

      nextAssignment: "Circuit Fundamentals Homework",

      nextClass: "Tomorrow • 9:00 AM",

      aiInsight:
        "You're consistently scoring above class average. Continue practicing circuit analysis.",
    },

    {
      id: "math2210",
      code: "MATH 2210",
      name: "Calculus II",

      credits: 4,

      color: "#22C55E",

      instructor: {
        name: "Prof. Adams",
        office: "Jones 214",
      },

      status: "active",

      grade: {
        letter: "A-",
        percentage: 91.8,
        points: 3.7,
      },

      assignments: {
        completed: 10,
        total: 13,
        missing: 1,
      },

      attendance: 96,

      nextAssignment: "Integration Worksheet",

      nextClass: "Today • 1:30 PM",

      aiInsight:
        "Spend an extra 45 minutes reviewing integration techniques before the next quiz.",
    },

    {
      id: "phys2210",
      code: "PHYS 2210",
      name: "Physics I",

      credits: 4,

      color: "#F97316",

      instructor: {
        name: "Dr. Hernandez",
      },

      status: "active",

      grade: {
        letter: "B+",
        percentage: 89.2,
        points: 3.3,
      },

      assignments: {
        completed: 8,
        total: 11,
        missing: 1,
      },

      attendance: 95,

      nextAssignment: "Projectile Motion Lab",

      nextClass: "Friday • 10:30 AM",

      aiInsight:
        "Completing your lab report early will improve your weekly workload balance.",
    },

    {
      id: "aero101",
      code: "AERO 101",
      name: "Foundations of the Air Force",

      credits: 2,

      color: "#6366F1",

      instructor: {
        name: "Capt. Walker",
      },

      status: "active",

      grade: {
        letter: "A",
        percentage: 98.3,
        points: 4.0,
      },

      assignments: {
        completed: 15,
        total: 15,
        missing: 0,
      },

      attendance: 100,

      nextAssignment: "Leadership Reflection",

      nextClass: "Thursday • 8:00 AM",

      aiInsight:
        "Outstanding performance. You're among the top cadets academically.",
    },
  ],
},
focus: {
  mission: {
    title: "Complete Calculus Worksheet",
    subtitle: "Highest Priority",
    description:
      "Finish your integration worksheet before tonight's deadline.",

    priority: "critical",

    progress: 72,

    estimatedMinutes: 45,

    dueText: "Tonight • 11:59 PM",
  },

  tasks: [
    {
      id: "focus-1",

      title: "Integration Problems",

      category: "assignment",

      priority: "critical",

      status: "in-progress",

      dueText: "Tonight",

      estimatedMinutes: 45,

      progress: 72,
    },

    {
      id: "focus-2",

      title: "Review Circuit Analysis",

      category: "study",

      priority: "high",

      status: "not-started",

      estimatedMinutes: 60,
    },

    {
      id: "focus-3",

      title: "Physics Lab Report",

      category: "project",

      priority: "medium",

      status: "not-started",

      estimatedMinutes: 90,
    },
  ],

  progress: {
    completedTasks: 3,

    totalTasks: 6,

    completedMinutes: 165,

    targetMinutes: 240,

    completionPercent: 69,
  },
},

coach: {
  summary: {
    productivityScore: 94,

    tasksRemaining: 3,

    estimatedMinutesRemaining: 195,

    completedToday: 5,

    aiSummary:
      "Excellent progress today. Completing Calculus before dinner keeps you comfortably ahead of schedule.",
  },

  mission: {
    title: "Finish Today's Critical Work",

    subtitle: "Keep your GPA above 3.8",

    confidence: 96,
  },

  recommendation: {
    title: "Complete Calculus First",

    reason:
      "It has the closest deadline and the highest academic impact.",

    confidence: 98,

    estimatedCompletionTime: "45 min",
  },

  insights: [
    {
      id: "coach-1",

      type: "achievement",

      title: "Study Streak",

      message: "You've studied every day for the past 14 days.",

      priority: "low",
    },

    {
      id: "coach-2",

      type: "recommendation",

      title: "Physics Review",

      message:
        "Spend one extra hour reviewing projectile motion before Friday.",

      priority: "medium",
    },

    {
      id: "coach-3",

      type: "warning",

      title: "Assignment Due Tonight",

      message:
        "Your Calculus worksheet is due at 11:59 PM.",

      priority: "critical",
    },
  ],

  tasks: [
    {
      id: "coach-task-1",

      title: "Finish Calculus Worksheet",

      priority: "critical",

      estimatedMinutes: 45,

      completed: false,

      category: "assignment",

      course: {
        id: "math2210",

        code: "MATH 2210",

        name: "Calculus II",

        color: "#22C55E",
      },
    },

    {
      id: "coach-task-2",

      title: "Review Engineering Notes",

      priority: "high",

      estimatedMinutes: 60,

      completed: false,

      category: "study",
    },

    {
      id: "coach-task-3",

      title: "Morning AFROTC PT",

      priority: "medium",

      estimatedMinutes: 75,

      completed: true,

      category: "class",
    },
  ],
},

priority: {
  recommendation: {
    title: "Complete your Calculus assignment before starting Physics.",
    description:
      "This maximizes today's productivity while reducing tomorrow's workload.",
  },

  priorities: [
    {
      id: "priority-1",

      title: "Calculus Worksheet",

      subtitle: "Due Tonight",

      source: "academics",

      level: "critical",

      status: "in-progress",

      score: 100,

      dueAt: new Date(),

      icon: BookOpen,

      color: "#EF4444",
    },

    {
      id: "priority-2",

      title: "Circuit Homework",

      subtitle: "Engineering",

      source: "deadlines",

      level: "high",

      status: "pending",

      score: 92,

      icon: Zap,

      color: "#3B82F6",
    },

    {
      id: "priority-3",

      title: "Physics Lab",

      subtitle: "Friday",

      source: "academics",

      level: "medium",

      status: "pending",

      score: 70,

      icon: Brain,

      color: "#F97316",
    },
  ],
},
};