import type { GalaxyMap, GalaxyCell } from "./GalaxyMap";

export class GalaxySampler {
  constructor(private readonly map: GalaxyMap) {}

  sample(x: number, y: number): GalaxyCell {
    const gx = Math.max(
      0,
      Math.min(
        this.map.width - 1,
        Math.floor(x * this.map.width)
      )
    );

    const gy = Math.max(
      0,
      Math.min(
        this.map.height - 1,
        Math.floor(y * this.map.height)
      )
    );

    return this.map.cells[
      gy * this.map.width + gx
    ];
  }

  density(x: number, y: number) {
    return this.sample(x, y).density;
  }

  galaxy(x: number, y: number) {
    return this.sample(x, y).galaxy;
  }

  nebula(x: number, y: number) {
    return this.sample(x, y).nebula;
  }

  arm(x: number, y: number) {
    return this.sample(x, y).armStrength;
  }

  core(x: number, y: number) {
    return this.sample(x, y).coreStrength;
  }

  halo(x: number, y: number) {
    return this.sample(x, y).haloStrength;
  }

  dust(x: number, y: number) {
    return this.sample(x, y).dust;
  }
}