"use client";

import {
  Calendar,
  BookOpen,
  GraduationCap,
  Mail,
  Sparkles,
  Plus,
} from "lucide-react";

import SchoolCard from "../ui/SchoolCard";

interface Action {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export default function QuickActionsCard() {
  const actions: Action[] = [
    {
      title: "Open Canvas",
      icon: <BookOpen size={18} />,
    },
    {
      title: "Calendar",
      icon: <Calendar size={18} />,
    },
    {
      title: "Add Assignment",
      icon: <Plus size={18} />,
    },
    {
      title: "Email Professor",
      icon: <Mail size={18} />,
    },
    {
      title: "AFROTC",
      icon: <GraduationCap size={18} />,
    },
    {
      title: "Ask Cosmic",
      icon: <Sparkles size={18} />,
    },
  ];

  return (
    <SchoolCard
      title="Quick Actions"
      subtitle="Jump to common tasks"
      accent="cyan"
    >
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className="group flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/10"
          >
            <div className="mb-3 text-cyan-300 transition-transform duration-300 group-hover:scale-110">
              {action.icon}
            </div>

            <div className="text-center text-sm font-medium text-white">
              {action.title}
            </div>
          </button>
        ))}
      </div>
    </SchoolCard>
  );
}