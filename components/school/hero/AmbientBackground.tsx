"use client";

import { motion } from "framer-motion";

export default function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none">

      {/* Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />

      {/* Aurora 1 */}
      <motion.div
        animate={{
          x: [-120, 80, -120],
          y: [-40, 60, -40],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          -left-40
          top-0
          h-[500px]
          w-[500px]
          rounded-full
          bg-violet-500/20
          blur-[120px]
        "
      />

      {/* Aurora 2 */}

      <motion.div
        animate={{
          x: [60, -80, 60],
          y: [40, -60, 40],
          scale: [1.05, .95, 1.05],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          right-[-120px]
          bottom-[-120px]
          h-[520px]
          w-[520px]
          rounded-full
          bg-sky-500/15
          blur-[140px]
        "
      />

      {/* Highlight */}

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top,rgba(255,255,255,.08),transparent_55%)]
        "
      />

      {/* Glass Reflection */}

      <div
        className="
          absolute
          inset-0
          bg-[linear-gradient(135deg,rgba(255,255,255,.08),transparent_35%)]
        "
      />

      {/* Noise */}

      <div
        className="
          absolute
          inset-0
          opacity-[0.025]
          mix-blend-soft-light
          bg-[url('/noise.png')]
        "
      />
      <div
  className="
    absolute
    inset-0
    bg-[radial-gradient(circle_at_15%_20%,rgba(139,92,246,.14),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(59,130,246,.10),transparent_35%),radial-gradient(circle_at_center,rgba(255,255,255,.02),transparent_65%)]
  "
/>
    </div>
    
  );
}