import { createSeededRandom } from "../utils/seededRandom";

export interface Star {
  x: number;
  y: number;

  radius: number;

  opacity: number;

  glowRadius: number;

  phase: number;

  speed: number;
}

const STAR_COUNTS = {
  sparse: 8,
  normal: 14,
  dense: 22,
} as const;

export function generateStars({
  density = "normal",
  seed = "clear-night",
}: {
  density?: keyof typeof STAR_COUNTS;
  seed?: string;
}): Star[] {
  const random = createSeededRandom(seed);

  const count = STAR_COUNTS[density];

  return Array.from({ length: count }, () => {
    let x = random(8, 92);
    let y = random(8, 46);

    while (x > 60 && y > 24) {
      x = random(8, 92);
      y = random(8, 46);
    }

    const radius = random(0.7, 2.1);

    return {
      x,
      y,

      radius,

      opacity: random(0.35, 1),

      glowRadius: radius * random(2.5, 4),

      phase: random(0, Math.PI * 2),

      speed: random(2, 6),
    };
  });
}