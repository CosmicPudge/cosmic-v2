"use client";

import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export interface HeroHeaderProps {
  location: string;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";

  return "Good Evening";
}

export default function HeroHeader({
  location,
}: HeroHeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const update = () => setTime(new Date());

    update();

    const interval = setInterval(update, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-end text-right">

      <p className="text-sm uppercase tracking-[0.28em] text-violet-300">
        {getGreeting()}
      </p>

      <h2 className="mt-2 text-5xl font-bold tracking-tight text-white">
        {time.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </h2>

      <p className="mt-2 text-lg text-white/65">
        {time.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="mt-4 flex items-center gap-2 text-white/50">
        <MapPin size={15} />

        <span>{location}</span>
      </div>
    </div>
  );
}