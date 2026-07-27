"use client";

import { motion } from "framer-motion";

import { useDisplay } from "@/components/os/display";

import type { WeatherData } from "@/engines/environment";

import { HERO_LAYOUTS } from "./heroLayouts";

interface Props {
  weather: WeatherData | null;
}

export default function HeroBackground({
  weather,
}: Props) {
  const { profile } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  const condition =
    weather?.condition.toLowerCase() ?? "";

  let primary = "rgba(255,255,255,0.10)";
  let secondary = "rgba(255,255,255,0.02)";

  if (condition.includes("clear")) {
    primary = "rgba(255,210,120,0.18)";
    secondary = "rgba(255,255,255,0.04)";
  }

  if (condition.includes("cloud")) {
    primary = "rgba(190,205,235,0.15)";
    secondary = "rgba(255,255,255,0.03)";
  }

  if (condition.includes("rain")) {
    primary = "rgba(70,130,255,0.18)";
    secondary = "rgba(20,40,90,0.06)";
  }

  if (condition.includes("storm")) {
    primary = "rgba(120,90,255,0.20)";
    secondary = "rgba(40,30,90,0.08)";
  }

  if (condition.includes("snow")) {
    primary = "rgba(255,255,255,0.20)";
    secondary = "rgba(180,220,255,0.06)";
  }

  const glowScale =
    hero.minHeight / 360;

  const noiseSize =
    Math.round(22 * glowScale);

  return (
    <>
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.85, 1, 0.85],
          scale: [
            1,
            1.02 * glowScale,
            1,
          ],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `
            radial-gradient(
              circle at 20% 20%,
              ${primary},
              transparent 55%
            )
          `,
        }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.6, 0.85, 0.6],
          scale: [
            1,
            1.015 * glowScale,
            1,
          ],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `
            radial-gradient(
              circle at 80% 70%,
              ${secondary},
              transparent 65%
            )
          `,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      <div
        className="
          absolute
          inset-0
          opacity-[0.03]
          mix-blend-soft-light
        "
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: `${noiseSize}px ${noiseSize}px`,
        }}
      />
    </>
  );
}