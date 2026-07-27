"use client";

import { motion } from "framer-motion";

import { useDisplay } from "@/components/os/display";
import GlassPanel from "@/components/os/ui/GlassPanel";
import useWeather from "@/hooks/os/useWeather";

import HeroBackground from "./HeroBackground";
import HeroClock from "./HeroClock";
import HeroDetails from "./HeroDetails";
import HeroGreeting from "./HeroGreeting";
import { HERO_LAYOUTS } from "./heroLayouts";
import HeroSun from "./HeroSun";
import HeroWeather from "./HeroWeather";

export default function DashboardHero() {
  const { weather, loading } = useWeather();

  const { profile, tokens } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  const stack =
    profile === "pocket" ||
    profile === "compact";

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
      <GlassPanel
        className="relative overflow-hidden"
        style={{
          minHeight: hero.minHeight,
          padding: hero.padding,
          borderRadius: tokens.radius.xl,
        }}
      >
        <HeroBackground weather={weather} />

        <div
          className="relative z-10 flex h-full"
          style={{
            gap: hero.gap,
            flexDirection: stack
              ? "column"
              : "row",
          }}
        >
          {/* LEFT COLUMN */}
          <div
            className="flex min-w-0 flex-1 flex-col justify-between"
            style={{
              gap: hero.gap,
            }}
          >
            <HeroGreeting />

            <HeroSun
              weather={weather}
              loading={loading}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div
            className="flex flex-col"
            style={{
              gap: hero.gap,
              flexBasis: stack
                ? "100%"
                : hero.rightColumnWidth,
              maxWidth: stack
                ? "100%"
                : hero.rightColumnWidth,
              alignItems: stack
                ? "stretch"
                : "flex-end",
              textAlign: stack
                ? "left"
                : "right",
              flexShrink: 1,
              minWidth: 0,
            }}
          >
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