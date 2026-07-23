"use client";

import { motion } from "framer-motion";

interface GradeRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
  gradientId?: string;
}

export default function GradeRing({
  value,
  size = 180,
  strokeWidth = 14,
  label,
  sublabel,
  showPercentage = true,
  gradientId = "grade-ring",
}: GradeRingProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const radius = (size - strokeWidth) / 2;

  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference - (clamped / 100) * circumference;

  const center = size / 2;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#22d3ee"
            />

            <stop
              offset="100%"
              stopColor="#34d399"
            />
          </linearGradient>
        </defs>

        {/* Background */}

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,.08)"
          strokeWidth={strokeWidth}
        />

        {/* Progress */}

        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{
            strokeDashoffset: circumference,
          }}
          animate={{
            strokeDashoffset: offset,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
        />
      </svg>

      {/* Center */}

      <div className="absolute flex flex-col items-center justify-center text-center">
        {showPercentage && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.25,
            }}
            className="text-4xl font-bold text-white"
          >
            {Math.round(clamped)}
            <span className="text-xl text-white/60">%</span>
          </motion.div>
        )}

        {label && (
          <div className="mt-2 text-sm font-medium text-white/80">
            {label}
          </div>
        )}

        {sublabel && (
          <div className="mt-1 text-xs text-white/45">
            {sublabel}
          </div>
        )}
      </div>

      {/* Ambient Glow */}

      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.18, 0.3, 0.18],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
        }}
        className="
          absolute
          inset-5
          rounded-full
          bg-cyan-400/10
          blur-3xl
          -z-10
        "
      />
    </div>
  );
}