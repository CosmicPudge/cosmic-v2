import {
  CELESTIAL_DAY_SECONDS,
  getCelestialPhase,
} from "./celestialTime";

const TAU = Math.PI * 2;

export type CosmicBackgroundVariant = "dashboard" | "ambient";
export type CosmicBackgroundIntensity = "low" | "normal" | "high";
export type CosmicBackgroundMotion = "off" | "subtle" | "normal";

export interface CanvasRendererOptions {
  variant?: CosmicBackgroundVariant;
  intensity?: CosmicBackgroundIntensity;
  motion?: CosmicBackgroundMotion;
  timeOverrideSeconds?: number;
  debug?: boolean;
  reducedMotion?: boolean;
}

interface WorldPoint {
  x: number;
  y: number;
}

interface Star extends WorldPoint {
  radius: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  warmth: number;
  diffraction: boolean;
}

interface NebulaRegion extends WorldPoint {
  radius: number;
  stretch: number;
  rotation: number;
  color: readonly [number, number, number];
  opacity: number;
}

interface Constellation {
  anchors: WorldPoint[];
  connections: ReadonlyArray<readonly [number, number]>;
  opacity: number;
  scale: number;
}

interface RendererSettings {
  variant: CosmicBackgroundVariant;
  intensity: CosmicBackgroundIntensity;
  motion: CosmicBackgroundMotion;
  timeOverrideSeconds?: number;
  debug: boolean;
  reducedMotion: boolean;
}

const DEFAULT_SETTINGS: RendererSettings = {
  variant: "dashboard",
  intensity: "normal",
  motion: "normal",
  debug: false,
  reducedMotion: false,
};

function createSeededRandom(seed = 0x43a0c) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function createStars(
  count: number,
  minRadius: number,
  maxRadius: number,
  maxOpacity: number,
  random: () => number,
  diffractionChance = 0,
): Star[] {
  return Array.from({ length: count }, () => {
    const angle = random() * TAU;
    const orbitRadius = 0.44 + Math.sqrt(random()) * 2.42;

    return {
      x: Math.cos(angle) * orbitRadius,
      y: Math.sin(angle) * orbitRadius,
      radius: minRadius + random() * (maxRadius - minRadius),
      opacity: maxOpacity * (0.32 + random() * 0.68),
      twinklePhase: random() * TAU,
      twinkleSpeed: 0.55 + random() * 0.9,
      warmth: random(),
      diffraction: random() < diffractionChance,
    };
  });
}

const CONSTELLATION_PATTERNS: ReadonlyArray<{
  points: ReadonlyArray<readonly [number, number]>;
  connections: ReadonlyArray<readonly [number, number]>;
}> = [
  {
    points: [[-0.12, -0.03], [-0.05, -0.11], [0.03, -0.06], [0.1, -0.14], [0.14, -0.02], [0.06, 0.05], [0.12, 0.12]],
    connections: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6]],
  },
  {
    points: [[-0.14, 0.08], [-0.08, -0.02], [-0.01, 0.03], [0.04, -0.08], [0.11, -0.02], [0.15, 0.08], [0.03, 0.11]],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 5]],
  },
  {
    points: [[-0.13, -0.08], [-0.03, -0.12], [0.02, -0.02], [0.13, 0.01], [0.06, 0.1], [-0.05, 0.08], [-0.12, 0.14]],
    connections: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6]],
  },
];

function createConstellations(random: () => number): Constellation[] {
  const angles = [-2.5, -1.55, -0.35, 0.72, 1.62, 2.66];

  return angles.map((angle, index) => {
    const pattern = CONSTELLATION_PATTERNS[index % CONSTELLATION_PATTERNS.length];
    const orbitRadius = 0.86 + random() * 0.54;
    const center = {
      x: Math.cos(angle) * orbitRadius,
      y: Math.sin(angle) * orbitRadius,
    };
    const rotation = random() * TAU;
    const scale = 0.72 + random() * 0.46;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);

    return {
      anchors: pattern.points.map(([x, y]) => ({
        x: center.x + (x * cosine - y * sine) * scale,
        y: center.y + (x * sine + y * cosine) * scale,
      })),
      connections: pattern.connections,
      opacity: 0.12 + random() * 0.09,
      scale,
    };
  });
}

const NEBULA_REGIONS: NebulaRegion[] = [
  { x: -0.03, y: -0.9, radius: 0.62, stretch: 1.55, rotation: -0.45, color: [84, 55, 190], opacity: 0.25 },
  { x: -0.42, y: -1.02, radius: 0.42, stretch: 1.9, rotation: 0.2, color: [174, 44, 148], opacity: 0.14 },
  { x: -0.98, y: -0.04, radius: 0.7, stretch: 1.7, rotation: 0.65, color: [20, 113, 210], opacity: 0.24 },
  { x: -1.2, y: 0.3, radius: 0.38, stretch: 1.45, rotation: -0.2, color: [23, 164, 184], opacity: 0.18 },
  { x: 0.92, y: 0.04, radius: 0.72, stretch: 1.75, rotation: -0.5, color: [13, 139, 154], opacity: 0.22 },
  { x: 1.18, y: -0.2, radius: 0.43, stretch: 1.5, rotation: 0.45, color: [177, 43, 137], opacity: 0.18 },
  { x: 0.58, y: 1.1, radius: 0.34, stretch: 1.35, rotation: 0.1, color: [35, 84, 170], opacity: 0.1 },
];

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly farStars: Star[];
  private readonly midStars: Star[];
  private readonly heroStars: Star[];
  private readonly constellations: Constellation[];
  private width = 0;
  private height = 0;
  private frame: number | null = null;
  private active = false;
  private lastFrameTime = 0;
  private settings: RendererSettings;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: CanvasRendererOptions = {},
  ) {
    const context = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!context) {
      throw new Error("Canvas unavailable");
    }

    this.context = context;
    this.settings = { ...DEFAULT_SETTINGS, ...options };

    const random = createSeededRandom();
    this.farStars = createStars(3_600, 0.22, 0.72, 0.42, random);
    this.midStars = createStars(920, 0.58, 1.42, 0.78, random);
    this.heroStars = createStars(62, 1.45, 2.85, 0.98, random, 0.24);
    this.constellations = createConstellations(random);
  }

  resize(width: number, height: number, devicePixelRatio: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
    this.canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
    this.context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.render(performance.now());
  }

  updateOptions(options: CanvasRendererOptions) {
    this.settings = { ...this.settings, ...options };
    this.render(performance.now());

    if (!this.active) {
      return;
    }

    if (this.shouldAnimate()) {
      this.requestNextFrame();
    } else if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  start() {
    if (this.active) {
      return;
    }

    this.active = true;
    this.lastFrameTime = 0;
    this.render(performance.now());

    if (this.shouldAnimate()) {
      this.requestNextFrame();
    }
  }

  stop() {
    this.active = false;

    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  destroy() {
    this.stop();
  }

  private shouldAnimate() {
    return this.settings.motion !== "off" && !this.settings.reducedMotion;
  }

  private requestNextFrame() {
    if (this.frame === null) {
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  private tick = (time: number) => {
    this.frame = null;

    if (!this.active || !this.shouldAnimate()) {
      return;
    }

    const frameInterval = this.settings.motion === "subtle" ? 50 : 1000 / 30;

    if (time - this.lastFrameTime >= frameInterval) {
      this.lastFrameTime = time;
      this.render(time);
    }

    this.requestNextFrame();
  };

  private getPhase() {
    const override = this.settings.timeOverrideSeconds;

    if (override === undefined) {
      return getCelestialPhase();
    }

    const normalized = ((override % CELESTIAL_DAY_SECONDS) + CELESTIAL_DAY_SECONDS) % CELESTIAL_DAY_SECONDS;
    return normalized / CELESTIAL_DAY_SECONDS;
  }

  private getProjection(phase: number, depthOffset = 0) {
    const angle = (phase + depthOffset) * TAU;
    const worldScale = Math.max(this.height, this.width * 0.56);

    return {
      angle,
      cosine: Math.cos(angle),
      sine: Math.sin(angle),
      pivotX: this.width * 0.5,
      pivotY: this.height * 1.72,
      worldScale,
    };
  }

  private project(point: WorldPoint, projection: ReturnType<CanvasRenderer["getProjection"]>) {
    return {
      x: projection.pivotX + (point.x * projection.cosine - point.y * projection.sine) * projection.worldScale,
      y: projection.pivotY + (point.x * projection.sine + point.y * projection.cosine) * projection.worldScale,
    };
  }

  private drawNebulae(phase: number) {
    const context = this.context;
    const projection = this.getProjection(phase);
    const variantBoost = this.settings.variant === "ambient" ? 1.28 : 0.82;
    const intensityBoost = this.settings.intensity === "low" ? 0.58 : this.settings.intensity === "high" ? 1.28 : 1;

    context.save();
    context.globalCompositeOperation = "screen";

    for (const [index, region] of NEBULA_REGIONS.entries()) {
      if (this.settings.intensity === "low" && index % 2 === 1) {
        continue;
      }

      const center = this.project(region, projection);
      const radius = region.radius * projection.worldScale;
      const reach = radius * region.stretch;

      if (
        center.x + reach < 0 ||
        center.x - reach > this.width ||
        center.y + reach < 0 ||
        center.y - reach > this.height
      ) {
        continue;
      }

      const opacity = Math.min(0.42, region.opacity * variantBoost * intensityBoost);
      const [red, green, blue] = region.color;

      context.save();
      context.translate(center.x, center.y);
      context.rotate(region.rotation + projection.angle);
      context.scale(region.stretch, 1);

      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${opacity})`);
      gradient.addColorStop(0.36, `rgba(${red}, ${green}, ${blue}, ${opacity * 0.52})`);
      gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, radius, 0, TAU);
      context.fill();
      context.restore();
    }

    context.restore();
  }

  private drawStars(
    stars: Star[],
    phase: number,
    time: number,
    layer: "far" | "mid" | "hero",
  ) {
    const context = this.context;
    const depthOffset = layer === "far" ? -0.0005 : layer === "hero" ? 0.0007 : 0;
    const projection = this.getProjection(phase, depthOffset);
    const intensityStep = this.settings.intensity === "low" ? 2 : 1;
    const variantBoost = this.settings.variant === "ambient" ? 1.12 : 0.9;
    const animatedTwinkle = layer === "hero"
      && this.settings.intensity !== "low"
      && this.shouldAnimate()
      && this.settings.motion === "normal";

    for (let index = 0; index < stars.length; index += intensityStep) {
      const star = stars[index];
      const point = this.project(star, projection);
      const margin = star.radius * 8;

      if (point.x < -margin || point.x > this.width + margin || point.y < -margin || point.y > this.height + margin) {
        continue;
      }

      const twinkle = animatedTwinkle
        ? 0.82 + Math.sin(time * 0.00028 * star.twinkleSpeed + star.twinklePhase) * 0.18
        : 1;
      const opacity = Math.min(1, star.opacity * variantBoost * twinkle);
      const red = Math.round(205 + star.warmth * 35);
      const green = Math.round(224 + star.warmth * 20);

      if (layer === "hero") {
        context.shadowColor = "rgba(184, 225, 255, 0.85)";
        context.shadowBlur = star.radius * (this.settings.variant === "ambient" ? 5.5 : 4);
      }

      context.fillStyle = `rgba(${red}, ${green}, 255, ${opacity})`;
      context.beginPath();
      context.arc(point.x, point.y, star.radius, 0, TAU);
      context.fill();

      if (layer === "hero" && star.diffraction && star.radius > 2.1) {
        const flareOpacity = opacity * 0.34;
        context.strokeStyle = `rgba(210, 238, 255, ${flareOpacity})`;
        context.lineWidth = 0.55;
        context.beginPath();
        context.moveTo(point.x - star.radius * 3.5, point.y);
        context.lineTo(point.x + star.radius * 3.5, point.y);
        context.moveTo(point.x, point.y - star.radius * 2.7);
        context.lineTo(point.x, point.y + star.radius * 2.7);
        context.stroke();
      }
    }

    context.shadowBlur = 0;
  }

  private drawConstellations(phase: number) {
    const context = this.context;
    const projection = this.getProjection(phase);
    const variantBoost = this.settings.variant === "ambient" ? 1.18 : 0.8;
    const intensityBoost = this.settings.intensity === "low" ? 0.62 : this.settings.intensity === "high" ? 1.2 : 1;

    context.save();
    context.lineWidth = 0.6;

    for (const constellation of this.constellations) {
      const anchors = constellation.anchors.map((anchor) => this.project(anchor, projection));

      if (!anchors.some((anchor) => anchor.x > -100 && anchor.x < this.width + 100 && anchor.y > -100 && anchor.y < this.height + 100)) {
        continue;
      }

      const opacity = constellation.opacity * variantBoost * intensityBoost;
      context.strokeStyle = `rgba(184, 218, 255, ${opacity})`;
      context.beginPath();

      for (const [fromIndex, toIndex] of constellation.connections) {
        const from = anchors[fromIndex];
        const to = anchors[toIndex];
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
      }

      context.stroke();

      for (const anchor of anchors) {
        context.fillStyle = `rgba(220, 240, 255, ${Math.min(0.9, opacity * 3.1)})`;
        context.beginPath();
        context.arc(anchor.x, anchor.y, 1.15 + constellation.scale * 0.25, 0, TAU);
        context.fill();
      }
    }

    context.restore();
  }

  private drawDebug(phase: number) {
    if (!this.settings.debug) {
      return;
    }

    const context = this.context;
    const projection = this.getProjection(phase);
    const angle = phase * 360;

    context.save();
    context.strokeStyle = "rgba(103, 232, 249, 0.7)";
    context.fillStyle = "rgba(207, 250, 254, 0.92)";
    context.lineWidth = 1;
    context.setLineDash([6, 6]);
    context.strokeRect(0.5, 0.5, this.width - 1, this.height - 1);

    context.beginPath();
    context.moveTo(projection.pivotX, this.height);
    context.lineTo(projection.pivotX, Math.max(0, this.height - 74));
    context.stroke();

    context.beginPath();
    context.arc(projection.pivotX, projection.pivotY, projection.worldScale * 0.72, 0, TAU);
    context.stroke();
    context.setLineDash([]);

    context.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.textAlign = "right";
    context.fillText(`angle ${angle.toFixed(2)}deg`, this.width - 16, 25);
    context.fillText(`phase ${phase.toFixed(5)}`, this.width - 16, 43);
    context.fillText(`viewport ${Math.round(this.width)} x ${Math.round(this.height)}`, this.width - 16, 61);
    context.textAlign = "center";
    context.fillText(`pivot ${Math.round(projection.pivotY - this.height)}px below viewport`, projection.pivotX, this.height - 18);
    context.restore();
  }

  private render(time: number) {
    if (!this.width || !this.height) {
      return;
    }

    const context = this.context;
    const phase = this.getPhase();
    const baseGradient = context.createLinearGradient(0, 0, 0, this.height);
    baseGradient.addColorStop(0, "#030512");
    baseGradient.addColorStop(0.52, "#050816");
    baseGradient.addColorStop(1, "#02030b");
    context.fillStyle = baseGradient;
    context.fillRect(0, 0, this.width, this.height);

    this.drawNebulae(phase);
    this.drawStars(this.farStars, phase, time, "far");
    this.drawConstellations(phase);
    this.drawStars(this.midStars, phase, time, "mid");
    this.drawStars(this.heroStars, phase, time, "hero");
    this.drawDebug(phase);
  }
}
