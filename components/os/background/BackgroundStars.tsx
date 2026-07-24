"use client";

import { useMemo } from "react";

interface BackgroundStarsProps {
  progress?: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

const STAR_COUNT = 450;

export default function BackgroundStars({
  progress = 1,
}: BackgroundStarsProps) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: STAR_COUNT }, (_, id) => ({
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * 8,
    }));
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes cosmic-twinkle {
          0%,
          100% {
            opacity: var(--opacity);
            transform: scale(1);
          }

          50% {
            opacity: calc(var(--opacity) * 0.35);
            transform: scale(1.4);
          }
        }
      `}</style>

      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: Math.max(0, (progress - 0.15) / 0.85),
        }}
      >
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={
              {
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                "--opacity": star.opacity,
                opacity: star.opacity,
                animation: `cosmic-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
                boxShadow: `0 0 ${star.size * 5}px rgba(255,255,255,.65)`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}