"use client";

import { NotificationsCard } from "@/components/school/notifications";
import { SchoolNotification } from "@/components/school/notifications";

const notifications: SchoolNotification[] = [
  {
    id: "1",
    title: "Physics Lab Report",
    message: "Due today at 11:59 PM.",
    type: "critical",
    priority: "urgent",
    source: "canvas",
    timestamp: "Due in 6 hours",
    read: false,
  },
  {
    id: "2",
    title: "Calculus Quiz Graded",
    message: "You scored 96% on Quiz 4.",
    type: "success",
    priority: "medium",
    source: "canvas",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "3",
    title: "Professor Announcement",
    message: "New lab instructions have been posted.",
    type: "info",
    priority: "medium",
    source: "canvas",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: "4",
    title: "AFROTC Leadership Lab",
    message: "Leadership Lab begins tonight at 6:00 PM.",
    type: "reminder",
    priority: "high",
    source: "calendar",
    timestamp: "Today",
    read: false,
  },
  {
    id: "5",
    title: "Today's Recommendation",
    message:
      "Completing EE245 today will reduce tomorrow's workload by approximately 35%.",
    type: "insight",
    priority: "medium",
    source: "cosmic",
    timestamp: "Just now",
    read: false,
    aiGenerated: true,
  },
];

export default function NotificationsDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-10">
      <div className="mx-auto max-w-3xl">
        <NotificationsCard
          notifications={notifications}
        />
      </div>
    </main>
  );
}