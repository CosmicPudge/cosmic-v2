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
  sparse: 120,
  normal: 220,
  dense: 350,
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

const roll = random(0, 100);

let radius: number;

if (roll < 92) {
  radius = random(0.08, 0.16);
} else if (roll < 99) {
  radius = random(0.18, 0.30);
} else {
  radius = random(0.40, 0.65);
}

    return {
      x,
      y,

      radius,

      opacity: 0.06,
      
      twinkles: random(0, 100) < 35,

      glowRadius: radius * random(1.2, 2),

      phase: random(0, Math.PI * 2),

      speed: random(0.00001, 0.00005),
    };
  });
}