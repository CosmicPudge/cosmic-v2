"use client";

import {
  TimelineCard,
  TimelineData,
} from "@/components/school/timeline";

const timelineData: TimelineData = {
  currentTime: "2:15 PM",

  events: [
    {
      id: "1",
      title: "Calculus II Lecture",
      description: "Chapter 6: Applications of Integration",
      type: "class",
      priority: "medium",
      status: "completed",
      startTime: "08:00",
      endTime: "09:15",
      timeLabel: "8:00 AM",
      dateLabel: "Today",
      durationMinutes: 75,
      location: {
        name: "Engineering 201",
      },
    },

    {
      id: "2",
      title: "EE245 Electronics Lab",
      description: "Complete breadboard amplifier circuit.",
      type: "assignment",
      priority: "high",
      status: "current",
      startTime: "10:30",
      endTime: "12:30",
      timeLabel: "Now",
      dateLabel: "Current",
      durationMinutes: 120,
      location: {
        name: "ENGR 302",
      },
      action: {
        label: "Open Assignment",
      },
    },

    {
      id: "3",
      title: "Lunch Break",
      description: "Recharge before afternoon study session.",
      type: "personal",
      priority: "low",
      status: "upcoming",
      startTime: "12:30",
      endTime: "1:00",
      timeLabel: "12:30 PM",
      dateLabel: "Today",
      durationMinutes: 30,
    },

    {
      id: "4",
      title: "Physics Study Session",
      description: "Review electric fields and practice problems.",
      type: "study",
      priority: "medium",
      status: "upcoming",
      startTime: "2:00",
      endTime: "3:30",
      timeLabel: "2:00 PM",
      dateLabel: "Today",
      durationMinutes: 90,
      location: {
        name: "Library",
      },
      action: {
        label: "Review Notes",
      },
    },

    {
      id: "5",
      title: "AFROTC Leadership Lab",
      description: "Leadership exercises and uniform inspection.",
      type: "afrotc",
      priority: "high",
      status: "upcoming",
      startTime: "6:00",
      endTime: "8:00",
      timeLabel: "6:00 PM",
      dateLabel: "Today",
      durationMinutes: 120,
      location: {
        name: "ROTC Building",
      },
    },

    {
      id: "6",
      title: "Complete EE245 Lab Report",
      description:
        "AI predicts finishing tonight keeps tomorrow completely open.",
      type: "deadline",
      priority: "critical",
      status: "upcoming",
      startTime: "11:59",
      timeLabel: "11:59 PM",
      dateLabel: "Due Today",
      aiGenerated: true,
      action: {
        label: "Continue",
      },
    },
  ],
};

export default function TimelineDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-10">
      <div className="mx-auto max-w-6xl">
        <TimelineCard data={timelineData} />
      </div>
    </main>
  );
}