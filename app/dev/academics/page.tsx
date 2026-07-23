"use client";

import { AcademicsCard } from "@/components/school/academics";
import { AcademicsData } from "@/components/school/academics";

const data: AcademicsData = {
  semester: {
    gpa: 3.82,
    average: 92,
    creditsCompleted: 15,
    creditsTotal: 15,
    standing: "excellent",
    scholarshipEligible: true,

    totalAssignments: 48,
    completedAssignments: 41,
    missingAssignments: 2,

    aiSummary:
      "You're performing exceptionally well this semester. Physics is currently your lowest-performing course, but maintaining a 90% or higher on the next exam is projected to raise your GPA while preserving scholarship eligibility.",
  },

  courses: [
    {
      id: "ee101",
      code: "ECE 1010",
      name: "Introduction to Electrical Engineering",

      credits: 3,

      status: "active",

      instructor: {
        name: "Dr. Sarah Thompson",
        email: "sarah.thompson@usu.edu",
      },

      grade: {
        letter: "A",
        percentage: 96,
        points: 4.0,
      },

      assignments: {
        completed: 11,
        total: 12,
        missing: 0,
      },

      attendance: 98,

      nextAssignment:
        "Circuit Design Lab • Tomorrow",

      nextClass:
        "Mon 9:00 AM",

      aiInsight:
        "You're consistently ahead in this course. Maintaining your current pace should secure an A.",
    },

    {
      id: "math1210",
      code: "MATH 1210",
      name: "Calculus II",

      credits: 4,

      status: "active",

      instructor: {
        name: "Dr. Emily Carter",
      },

      grade: {
        letter: "A-",
        percentage: 91,
        points: 3.7,
      },

      assignments: {
        completed: 8,
        total: 10,
        missing: 1,
      },

      attendance: 95,

      nextAssignment:
        "Integration Quiz • Friday",

      nextClass:
        "Tue 11:30 AM",

      aiInsight:
        "A strong score on the next quiz would likely move this course into an A.",
    },

    {
      id: "phys2210",
      code: "PHYS 2210",
      name: "Physics I",

      credits: 4,

      status: "active",

      instructor: {
        name: "Dr. Michael Reyes",
      },

      grade: {
        letter: "B+",
        percentage: 86,
        points: 3.3,
      },

      assignments: {
        completed: 9,
        total: 13,
        missing: 1,
      },

      attendance: 91,

      nextAssignment:
        "Lab Report Due Sunday",

      nextClass:
        "Wed 1:30 PM",

      aiInsight:
        "This is currently your lowest-performing course. Prioritize this week's lab report and review rotational dynamics.",
    },

    {
      id: "engl2010",
      code: "ENGL 2010",
      name: "Intermediate Writing",

      credits: 3,

      status: "active",

      instructor: {
        name: "Prof. Jennifer Hall",
      },

      grade: {
        letter: "A",
        percentage: 95,
        points: 4.0,
      },

      assignments: {
        completed: 13,
        total: 13,
        missing: 0,
      },

      attendance: 100,

      nextAssignment:
        "Peer Review Next Week",

      nextClass:
        "Thu 10:30 AM",

      aiInsight:
        "Excellent work. Continue your current pace.",
    },

    {
      id: "afrotc100",
      code: "AERO 1000",
      name: "Air Force ROTC Foundations",

      credits: 1,

      status: "active",

      instructor: {
        name: "Capt. Williams",
      },

      grade: {
        letter: "A",
        percentage: 99,
        points: 4.0,
      },

      assignments: {
        completed: 6,
        total: 6,
        missing: 0,
      },

      attendance: 100,

      nextAssignment:
        "Leadership Reflection",

      nextClass:
        "Friday 0600",

      aiInsight:
        "Outstanding performance. You're setting the standard for the class.",
    },
  ],
};

export default function AcademicsDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-8 py-10">
      <div className="mx-auto max-w-7xl">
        <AcademicsCard data={data} />
      </div>
    </main>
  );
}