"use client";

import {
  BookOpen,
  Brain,
  Calendar,
  CloudSun,
  FileText,
  FolderOpen,
  Mail,
  Music,
  Settings,
  Shield,
} from "lucide-react";

import { QuickActionsCard } from "@/components/school/quickactions";
import type {
  QuickActionsData,
} from "@/components/school/quickactions";

const data: QuickActionsData = {
  actions: [
    {
      id: "canvas",
      title: "Canvas",
      subtitle: "Assignments & Courses",
      icon: BookOpen,
      href: "/school/canvas",
      category: "school",
      variant: "primary",
      color: "#4F8EF7",
      notification: true,
      badge: {
        value: "3 Due",
        color: "#EF4444",
      },
    },

    {
      id: "outlook",
      title: "Outlook",
      subtitle: "Email & Messages",
      icon: Mail,
      href: "/school/outlook",
      category: "communication",
      variant: "primary",
      color: "#3B82F6",
      notification: true,
      badge: {
        value: "12",
        color: "#2563EB",
      },
    },

    {
      id: "calendar",
      title: "Calendar",
      subtitle: "Upcoming Events",
      icon: Calendar,
      href: "/calendar",
      category: "productivity",
      variant: "primary",
      color: "#A855F7",
    },

    {
      id: "aicoach",
      title: "AI Coach",
      subtitle: "Daily Recommendations",
      icon: Brain,
      href: "/school/aicoach",
      category: "assistant",
      variant: "primary",
      color: "#14B8A6",
      notification: true,
    },

    {
      id: "afrotc",
      title: "AFROTC",
      subtitle: "Cadet Dashboard",
      icon: Shield,
      href: "/school/afrotc",
      category: "school",
      variant: "secondary",
      color: "#F59E0B",
    },

    {
      id: "weather",
      title: "Weather",
      subtitle: "Current Conditions",
      icon: CloudSun,
      href: "/weather",
      category: "utility",
      variant: "secondary",
      color: "#06B6D4",
    },

    {
      id: "notes",
      title: "Notes",
      subtitle: "Quick Capture",
      icon: FileText,
      href: "/notes",
      category: "productivity",
      variant: "secondary",
      color: "#22C55E",
    },

    {
      id: "files",
      title: "Files",
      subtitle: "Browse Documents",
      icon: FolderOpen,
      href: "/files",
      category: "utility",
      variant: "secondary",
      color: "#F97316",
    },

    {
      id: "music",
      title: "Music",
      subtitle: "Focus Playlist",
      icon: Music,
      href: "/music",
      category: "media",
      variant: "secondary",
      color: "#EC4899",
    },

    {
      id: "settings",
      title: "Settings",
      subtitle: "Coming Soon",
      icon: Settings,
      href: "#",
      category: "system",
      variant: "secondary",
      color: "#94A3B8",
      disabled: true,
      badge: {
        value: "Soon",
        color: "#64748B",
      },
    },
  ],
};

export default function QuickActionsDevPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <QuickActionsCard data={data} />
      </div>
    </main>
  );
}