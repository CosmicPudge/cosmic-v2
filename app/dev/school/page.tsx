"use client";

import { SchoolDashboard } from "@/components/school/dashboard";
import {
  Bell,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  GraduationCap,
  Lightbulb,
  Rocket,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

export default function SchoolDevPage() {
  const dashboardData = {
    greeting: {
      firstName: "Stetson",
      semester: "Fall 2026",
      university: "Utah State University",
      major: "Electrical Engineering",
      minor: "Aerospace Science",
      avatar: "/images/profile.png",
      message:
        "Welcome back! Here's everything happening across your semester.",
      period: "morning" as const,
      title: "Welcome back!",
      subtitle: "You're on a 14-day study streak",
    },

    overview: {
      gpa: 3.87,
      creditsCompleted: 38,
      creditsInProgress: 16,
      degreeProgress: 31,
      attendance: 98,
      studyStreak: 14,
      assignmentsCompleted: 47,
      assignmentsRemaining: 11,
      currentWeek: 4,
      semesterWeeks: 16,
    },

    academics: {
      overallAverage: 94.6,
      totalAssignments: 58,
      completedAssignments: 47,
      missingAssignments: 2,

      classes: [
        {
          id: "ee101",
          name: "ENGR 1010",
          title: "Introduction to Engineering",
          instructor: "Dr. Wilson",
          room: "ENGR 302",
          color: "#3B82F6",
          grade: "A",
          percentage: 96.4,
          credits: 3,
          nextClass: "Tomorrow • 9:00 AM",

          assignments: [
            {
              id: "hw1",
              title: "Circuit Fundamentals",
              due: "Tomorrow",
              status: "pending",
              score: null,
            },
            {
              id: "lab1",
              title: "Breadboard Lab",
              due: "Completed",
              status: "completed",
              score: 100,
            },
            {
              id: "quiz1",
              title: "Ohm's Law Quiz",
              due: "Completed",
              status: "completed",
              score: 96,
            },
          ],
        },

        {
          id: "math2210",
          name: "MATH 2210",
          title: "Calculus II",
          instructor: "Prof. Adams",
          room: "JON 115",
          color: "#10B981",
          grade: "A-",
          percentage: 91.8,
          credits: 4,
          nextClass: "Today • 1:30 PM",

          assignments: [
            {
              id: "calc1",
              title: "Integration Worksheet",
              due: "Tonight",
              status: "pending",
              score: null,
            },
            {
              id: "calc2",
              title: "Series Homework",
              due: "Completed",
              status: "completed",
              score: 94,
            },
          ],
        },

        {
          id: "phys2210",
          name: "PHYS 2210",
          title: "Physics I",
          instructor: "Dr. Hernandez",
          room: "SER 204",
          color: "#F97316",
          grade: "B+",
          percentage: 89.2,
          credits: 4,
          nextClass: "Friday • 10:30 AM",

          assignments: [
            {
              id: "physlab",
              title: "Projectile Motion Lab",
              due: "Friday",
              status: "pending",
              score: null,
            },
            {
              id: "exam1",
              title: "Exam 1",
              due: "Completed",
              status: "completed",
              score: 88,
            },
          ],
        },

        {
          id: "afrotc",
          name: "AERO 101",
          title: "Foundations of the Air Force",
          instructor: "Capt. Walker",
          room: "Military Science",
          color: "#6366F1",
          grade: "A",
          percentage: 98.3,
          credits: 2,
          nextClass: "Thursday • 8:00 AM",

          assignments: [
            {
              id: "briefing",
              title: "Leadership Reflection",
              due: "Sunday",
              status: "pending",
              score: null,
            },
            {
              id: "fitness",
              title: "PT Assessment",
              due: "Completed",
              status: "completed",
              score: 100,
            },
          ],
        },
      ],
    },

    deadlines: [
      {
        id: "1",
        title: "Calculus Integration Worksheet",
        course: "MATH 2210",
        due: "Tonight • 11:59 PM",
        priority: "high",
        completed: false,
      },

      {
        id: "2",
        title: "Engineering Circuit Homework",
        course: "ENGR 1010",
        due: "Tomorrow • 9:00 AM",
        priority: "high",
        completed: false,
      },

      {
        id: "3",
        title: "Physics Lab Report",
        course: "PHYS 2210",
        due: "Friday",
        priority: "medium",
        completed: false,
      },

      {
        id: "4",
        title: "Leadership Reflection",
        course: "AERO 101",
        due: "Sunday",
        priority: "low",
        completed: false,
      },
    ],

    notifications: [
      {
        id: "n1",
        title: "Assignment Due Tonight",
        description:
          "Your Calculus Integration Worksheet is due at 11:59 PM.",
        type: "warning",
        time: "10 min ago",
        unread: true,
      },

      {
        id: "n2",
        title: "Grade Posted",
        description: "Physics Exam 1 has been graded.",
        type: "success",
        time: "1 hour ago",
        unread: true,
      },
            {
        id: "n3",
        title: "AFROTC PT Tomorrow",
        description: "Physical training begins at 6:30 AM. Meet at the track.",
        type: "info",
        time: "3 hours ago",
        unread: false,
      },

      {
        id: "n4",
        title: "Registration Opens Soon",
        description: "Spring semester registration opens next Monday.",
        type: "info",
        time: "Yesterday",
        unread: false,
      },
    ],

    priority: [
      {
        id: "p1",
        title: "Finish Calculus Homework",
        description: "Complete the final three integration problems.",
        priority: "Critical",
        progress: 72,
        due: "Tonight",
      },

      {
        id: "p2",
        title: "Study Engineering Circuits",
        description: "Review Kirchhoff's Laws before tomorrow's lecture.",
        priority: "High",
        progress: 35,
        due: "Tomorrow",
      },

      {
        id: "p3",
        title: "Complete Physics Lab",
        description: "Write discussion and conclusion sections.",
        priority: "Medium",
        progress: 54,
        due: "Friday",
      },

      {
        id: "p4",
        title: "Prepare AFROTC Reflection",
        description: "Write one-page leadership reflection.",
        priority: "Low",
        progress: 15,
        due: "Sunday",
      },
    ],

    coach: {
      greeting:
        "You're doing great this week. Focus on finishing Calculus tonight and spend at least one hour reviewing Engineering before class tomorrow.",

      recommendations: [
        {
          title: "Complete Calculus First",
          description:
            "This assignment has the closest deadline and highest impact.",
          icon: Brain,
        },

        {
          title: "Review Circuits",
          description:
            "Spend 45–60 minutes reviewing Kirchhoff's Voltage and Current Laws.",
          icon: Zap,
        },

        {
          title: "Start Physics Early",
          description:
            "Beginning the lab today will reduce stress before Friday.",
          icon: Rocket,
        },

        {
          title: "Maintain Your Streak",
          description:
            "You're on a 14-day study streak. Don't break the momentum.",
          icon: Trophy,
        },
      ],
    },

    focus: {
      active: false,
      duration: 50,
      break: 10,
      sessionsToday: 3,
      weeklyHours: 18.5,
      distractionScore: 92,
    },

    afrotc: {
      fitnessScore: 96,
      leadershipScore: 94,
      attendance: 100,

      nextEvent: {
        title: "Morning PT",
        date: "Tomorrow",
        time: "6:30 AM",
        location: "USU Track",
      },

      upcomingEvents: [
        {
          title: "Leadership Lab",
          date: "Thursday",
        },

        {
          title: "Drill Practice",
          date: "Friday",
        },

        {
          title: "Wing Meeting",
          date: "Monday",
        },
      ],
    },

    quickActions: [
      {
        title: "View Assignments",
        icon: BookOpen,
      },

      {
        title: "Open Calendar",
        icon: Calendar,
      },

      {
        title: "Start Focus Session",
        icon: Clock,
      },

      {
        title: "AI Study Coach",
        icon: Brain,
      },

      {
        title: "Grades",
        icon: GraduationCap,
      },

      {
        title: "Notifications",
        icon: Bell,
      },
    ],

    timeline: [
      {
        time: "6:30 AM",
        title: "Wake Up",
        icon: Clock,
      },

      {
        time: "8:00 AM",
        title: "Engineering Lecture",
        icon: BookOpen,
      },

      {
        time: "11:00 AM",
        title: "Study Session",
        icon: Brain,
      },

      {
        time: "1:30 PM",
        title: "Calculus II",
        icon: GraduationCap,
      },

      {
        time: "3:00 PM",
        title: "Physics Lab",
        icon: Lightbulb,
      },

      {
        time: "6:00 PM",
        title: "Homework",
        icon: CheckCircle2,
      },

      {
        time: "8:00 PM",
        title: "AI Review Session",
        icon: Star,
      },

      {
        time: "10:00 PM",
        title: "Plan Tomorrow",
        icon: Target,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SchoolDashboard
    data={dashboardData}
    title="School Dashboard"
    notificationCount={dashboardData.notifications.filter(n => n.unread).length}
    online={true}
/>
    </div>
  );
}
