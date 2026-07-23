"use client";

import {
  AFROTCCard,
  type AFROTCData,
} from "@/components/school/afrotc";

const now = Date.now();

const data: AFROTCData = {
  cadet: {
    id: "cadet-001",
    firstName: "Stetson",
    lastName: "Trussell",

    rank: "C/Amn",

    status: "active",

    detachment: "Detachment 860",
    squadron: "Alpha Squadron",
    flight: "Bravo Flight",

    academicYear: "AS100",
    semester: "Fall 2026",
  },

  uniform: {
    type: "OCP",

    notes:
      "Leadership Laboratory today. Ensure your uniform is inspection ready.",

    items: [
      {
        id: "blouse",
        name: "OCP Blouse",
        required: true,
        packed: true,
      },
      {
        id: "trousers",
        name: "OCP Trousers",
        required: true,
        packed: true,
      },
      {
        id: "boots",
        name: "Boots",
        required: true,
        packed: true,
      },
      {
        id: "belt",
        name: "Rigger Belt",
        required: true,
        packed: true,
      },
      {
        id: "cover",
        name: "OCP Patrol Cap",
        required: true,
        packed: true,
      },
      {
        id: "notebook",
        name: "Field Notebook",
        required: true,
        packed: false,
      },
      {
        id: "water",
        name: "Water Bottle",
        required: false,
        packed: true,
      },
    ],
  },

  pt: {
    pushUps: 46,
    sitUps: 54,
    runTime: "10:41",

    goalPushUps: 55,
    goalSitUps: 60,
    goalRunTime: "9:45",
  },

  events: [
    {
      id: "pt",
      title: "Morning PT",
      description:
        "Squadron conditioning workout and stretching.",

      type: "pt",

      start: new Date(now + 1000 * 60 * 60 * 18),
      end: new Date(now + 1000 * 60 * 60 * 19),

      location: "Aggie Legacy Fields",

      required: true,
    },

    {
      id: "class",
      title: "Aerospace Studies",
      description:
        "Leadership fundamentals and Air Force heritage.",

      type: "class",

      start: new Date(now + 1000 * 60 * 60 * 30),
      end: new Date(now + 1000 * 60 * 60 * 31),

      location: "Engineering Building",

      required: true,
    },

    {
      id: "llab",
      title: "Leadership Laboratory",
      description:
        "Drill, customs and courtesies, leadership exercises.",

      type: "llab",

      start: new Date(now + 1000 * 60 * 60 * 52),
      end: new Date(now + 1000 * 60 * 60 * 55),

      location: "Detachment Headquarters",

      required: true,
    },

    {
      id: "inspection",
      title: "Uniform Inspection",

      description:
        "Dress and appearance inspection before LLAB.",

      type: "inspection",

      start: new Date(now + 1000 * 60 * 60 * 51),

      end: new Date(now + 1000 * 60 * 60 * 51.5),

      location: "Detachment Headquarters",

      required: true,
    },

    {
      id: "meeting",
      title: "Flight Briefing",

      description:
        "Weekly briefing with Flight Commander.",

      type: "meeting",

      start: new Date(now + 1000 * 60 * 60 * 76),

      end: new Date(now + 1000 * 60 * 60 * 77),

      location: "Classroom 102",

      required: false,
    },
  ],

  readiness: [
    {
      id: "uniform",
      title: "Uniform Prepared",

      description:
        "OCP uniform cleaned and ready.",

      status: "complete",
    },

    {
      id: "boots",
      title: "Boots Cleaned",

      description:
        "Boots meet inspection standards.",

      status: "complete",
    },

    {
      id: "haircut",
      title: "Haircut",

      description:
        "Within Air Force grooming standards.",

      status: "complete",
    },

    {
      id: "notebook",
      title: "Field Notebook",

      description:
        "Remember to pack before LLAB.",

      status: "attention",
    },

    {
      id: "hydration",
      title: "Hydration",

      description:
        "Fill water bottle before PT.",

      status: "attention",
    },

    {
      id: "assignment",
      title: "Leadership Reflection",

      description:
        "Submit reflection before Friday.",

      status: "missing",
    },
  ],
};

export default function AFROTCDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-10">
      <div className="mx-auto max-w-7xl">
        <AFROTCCard data={data} />
      </div>
    </main>
  );
}