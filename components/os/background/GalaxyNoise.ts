import { GalaxySeed } from "./GalaxySeed";

export interface NoiseOptions {
  scale?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
}

export class GalaxyNoise {
  private readonly permutation: number[] = [];

  constructor(seed = 8675309) {
    const rng = new GalaxySeed(seed);

    const p = Array.from({ length: 256 }, (_, i) => i);

    // Fisher-Yates shuffle using deterministic RNG
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(rng.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private grad(hash: number, x: number, y: number): number {
    switch (hash & 7) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      case 3:
        return -x - y;
      case 4:
        return x;
      case 5:
        return -x;
      case 6:
        return y;
      default:
        return -y;
    }
  }

  private perlin(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.permutation[this.permutation[X] + Y];
    const ab = this.permutation[this.permutation[X] + Y + 1];
    const ba = this.permutation[this.permutation[X + 1] + Y];
    const bb = this.permutation[this.permutation[X + 1] + Y + 1];

    const x1 = this.lerp(
      this.grad(aa, xf, yf),
      this.grad(ba, xf - 1, yf),
      u
    );

    const x2 = this.lerp(
      this.grad(ab, xf, yf - 1),
      this.grad(bb, xf - 1, yf - 1),
      u
    );

    return this.lerp(x1, x2, v);
  }

  sample(
    x: number,
    y: number,
    options: NoiseOptions = {}
  ): number {
    const {
      scale = 4,
      octaves = 5,
      persistence = 0.5,
      lacunarity = 2,
    } = options;

    let amplitude = 1;
    let frequency = 1;
    let total = 0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total +=
        this.perlin(
          x * scale * frequency,
          y * scale * frequency
        ) * amplitude;

      maxValue += amplitude;

      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return (total / maxValue + 1) * 0.5;
  }
}