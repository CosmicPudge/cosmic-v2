"use client";

import { motion } from "framer-motion";

import { useDisplay } from "@/components/os/display";

import { HERO_LAYOUTS } from "./heroLayouts";
import { dashboardImage } from "@/components/dashboard/images/dashboardImageManifest";

function quickBriefImage() {
  const hour = new Date().getHours();
  const id = hour < 6 ? "quick-brief-night" : hour < 12 ? "quick-brief-morning" : hour < 17 ? "quick-brief-day" : hour < 22 ? "quick-brief-evening" : "quick-brief-night";
  return dashboardImage(id);
}

export default function HeroBackground() {
  const { profile } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  const glowScale =
    hero.minHeight / 360;

  const noiseSize =
    Math.round(22 * glowScale);
  const image = quickBriefImage();

  return (
    <>
      {image.src && <img src={image.src} alt="" aria-hidden="true" className="dashboard-hero-image absolute inset-0 h-full w-full object-cover" style={{ objectPosition: image.objectPosition }} />}
      <div className="dashboard-hero-overlay absolute inset-0" aria-hidden="true" />
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
              rgba(94, 83, 220, .16),
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
              rgba(24, 196, 255, .05),
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
