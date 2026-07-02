"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  scale: number;
}

interface Props {
  count?: number;
  size?: number;
  speed?: number;
  opacity?: number;
}

export default function ParticlesLayer({
  count = 50,
  size = 3,
  speed = 25,
  opacity = 0.15,
}: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * speed,
      duration: speed + Math.random() * 10,
      scale: 0.5 + Math.random(),
    }));

    setParticles(generated);
  }, [count, speed]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: size * particle.scale,
            height: size * particle.scale,
            opacity,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}