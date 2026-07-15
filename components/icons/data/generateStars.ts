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
  sparse: 80,
  normal: 140,
  dense: 240,
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

    let radius: number;

const chance = random(0, 100);

if (chance < 85) {
  // Tiny stars
  radius = random(0.08, 0.18);
} else if (chance < 98) {
  // Medium stars
  radius = random(0.2, 0.35);
} else {
  // Bright stars
  radius = random(0.45, 0.7);
}

    return {
      x,
      y,

      radius,

      opacity: random(0.2, 0.8),

      glowRadius: radius * random(1.5, 2.2),

      phase: random(0, Math.PI * 2),

      speed: random(0.2, 0.8),
    };
  });
}