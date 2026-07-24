/**
 * Cosmic Galaxy Seed
 *
 * One deterministic random generator used by every
 * background renderer.
 */

export class GalaxySeed {
  private state: number;

  constructor(seed = 8675309) {
    this.state = seed >>> 0;
  }

  random() {
    this.state =
      (this.state * 1664525 + 1013904223) >>> 0;

    return this.state / 4294967296;
  }

  range(min: number, max: number) {
    return min + (max - min) * this.random();
  }

  chance(probability: number) {
    return this.random() < probability;
  }

  pick<T>(items: readonly T[]): T {
    return items[
      Math.floor(this.random() * items.length)
    ];
  }
}