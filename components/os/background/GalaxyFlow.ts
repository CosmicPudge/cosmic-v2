import type { GalaxyMap } from "./GalaxyMap";
import { GalaxySampler } from "./GalaxySampler";

export interface FlowVector {
  x: number;
  y: number;
}

export class GalaxyFlow {
  private readonly sampler: GalaxySampler;

  constructor(galaxy: GalaxyMap) {
    this.sampler = new GalaxySampler(galaxy);
  }

  sample(x: number, y: number): FlowVector {
    const arm = this.sampler.arm(x, y);
    const core = this.sampler.core(x, y);

    const dx = x - 0.5;
    const dy = y - 0.5;

    const radius = Math.sqrt(dx * dx + dy * dy);

    if (radius < 0.0001) {
      return { x: 0, y: 0 };
    }

    // Tangential direction around the center
    const tx = -dy / radius;
    const ty = dx / radius;

    // Stronger flow in spiral arms, calmer in the core
    const strength =
      (0.02 + arm * 0.08) * (1 - core * 0.6);

    return {
      x: tx * strength,
      y: ty * strength,
    };
  }
}