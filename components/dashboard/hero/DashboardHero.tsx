"use client";

import { motion } from "framer-motion";

import GlassPanel from "@/components/os/ui/GlassPanel";
import useWeather from "@/hooks/os/useWeather";

import HeroBackground from "./HeroBackground";
import HeroGreeting from "./HeroGreeting";
import HeroClock from "./HeroClock";
import HeroWeather from "./HeroWeather";
import HeroDetails from "./HeroDetails";
import HeroSun from "./HeroSun";

export default function DashboardHero() {
  const { weather, loading } = useWeather();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}
      className="w-full"
    >
      <GlassPanel className="relative min-h-[360px] overflow-hidden rounded-[36px] p-10">
        <HeroBackground weather={weather} />

        <div className="relative z-10 flex h-full justify-between gap-12">
          {/* LEFT COLUMN */}
          <div className="flex max-w-3xl flex-1 flex-col justify-between">
            <HeroGreeting />

            <HeroSun
              weather={weather}
              loading={loading}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex w-[420px] flex-col items-end justify-between text-right">
            <HeroClock />

            <HeroWeather
              weather={weather}
              loading={loading}
            />

            <HeroDetails
              weather={weather}
              loading={loading}
            />
          </div>
        </div>
      </GlassPanel>
    </motion.section>
  );
}