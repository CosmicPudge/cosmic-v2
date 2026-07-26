"use client";

import DashboardCard from "../shared/DashboardCard";

const items = [
  {
    emoji: "🌤",
    title: "Beautiful weather today",
    description: "Clear skies with comfortable temperatures.",
  },
  {
    emoji: "⚾",
    title: "Angels play tonight",
    description: "First pitch begins at 7:38 PM.",
  },
  {
    emoji: "🎓",
    title: "Assignments",
    description: "No assignments due today.",
  },
  {
    emoji: "🚗",
    title: "Garage",
    description: "Your Civic has no active reminders.",
  },
];

export default function BriefingCard() {
  return (
    <DashboardCard
      title="Cosmic Briefing"
      subtitle="Your day at a glance"
      glass="lg"
      hover={false}
      className="h-[320px]"
    >
      <div className="flex flex-col gap-5">

        {items.map((item) => (
          <div
            key={item.title}
            className="
              rounded-2xl
              bg-white/[0.03]
              border
              border-white/[0.05]
              p-4
              transition-all
              duration-300
              hover:bg-white/[0.05]
            "
          >
            <div className="flex gap-4">

              <div className="text-2xl">
                {item.emoji}
              </div>

              <div>

                <h3 className="font-semibold">
                  {item.title}
                </h3>

                <p className="text-sm text-white/60 mt-1">
                  {item.description}
                </p>

              </div>

            </div>

          </div>
        ))}

      </div>
    </DashboardCard>
  );
}