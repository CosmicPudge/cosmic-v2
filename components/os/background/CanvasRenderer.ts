import { Camera } from "./Camera";
import { Universe } from "./Universe";
import { drawNebula } from "./drawNebula";
import { drawStar } from "./drawStar";
import { generateNebula } from "./generateNebula";
import { generateSky } from "./generateSky";
import type { GeneratedUniverse, ScreenPoint, Viewport } from "./types";
import { isScreenCircleVisible, worldToScreen } from "./worldToScreen";

/**
 * Owns the canvas render loop and coordinates the world-to-screen pipeline.
 * Procedural generation is completed once during construction.
 */
export class CanvasRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly camera: Camera;
  private readonly universe: GeneratedUniverse;
  private readonly viewport: Viewport;
  private readonly starScreenPoint: ScreenPoint;
  private readonly nebulaScreenPoint: ScreenPoint;

  private animationFrameId: number | null = null;
  private isRunning = false;

  public constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (context === null) {
      throw new Error("Cosmic background requires a Canvas 2D context.");
    }

    this.canvas = canvas;
    this.context = context;
    this.camera = new Camera();
    this.universe = {
      sky: generateSky(),
      nebula: generateNebula(),
    };
    this.viewport = {
      width: 0,
      height: 0,
      devicePixelRatio: 1,
    };
    this.starScreenPoint = { x: 0, y: 0, scale: 1, depth: 0 };
    this.nebulaScreenPoint = { x: 0, y: 0, scale: 1, depth: 0 };
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.animationFrameId = window.requestAnimationFrame(this.renderFrame);
  }

  public stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resize(
    width: number,
    height: number,
    devicePixelRatio: number,
  ): void {
    const cappedDevicePixelRatio = Math.min(
      devicePixelRatio,
      Universe.rendering.devicePixelRatioMaximum,
    );
    const pixelWidth = Math.floor(width * cappedDevicePixelRatio);
    const pixelHeight = Math.floor(height * cappedDevicePixelRatio);

    this.viewport.width = width;
    this.viewport.height = height;
    this.viewport.devicePixelRatio = cappedDevicePixelRatio;

    if (
      this.canvas.width !== pixelWidth ||
      this.canvas.height !== pixelHeight
    ) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }

    this.context.setTransform(
      cappedDevicePixelRatio,
      0,
      0,
      cappedDevicePixelRatio,
      0,
      0,
    );
  }

  public setZoom(zoom: number): void {
    this.camera.setZoom(zoom);
  }

  public destroy(): void {
    this.stop();
  }

  private readonly renderFrame = (elapsedMilliseconds: number): void => {
    if (!this.isRunning) {
      return;
    }

    this.render(elapsedMilliseconds);
    this.animationFrameId = window.requestAnimationFrame(this.renderFrame);
  };

  private render(elapsedMilliseconds: number): void {
    if (this.viewport.width === 0 || this.viewport.height === 0) {
      return;
    }

    this.camera.update(elapsedMilliseconds);
    this.clearFrame();
    this.renderNebula();
    this.renderStars(elapsedMilliseconds);

    this.context.globalAlpha = 1;
    this.context.shadowBlur = 0;
    this.context.globalCompositeOperation = "source-over";
  }

  private clearFrame(): void {
    this.context.globalCompositeOperation = "source-over";
    this.context.globalAlpha = 1;
    this.context.shadowBlur = 0;
    this.context.fillStyle = Universe.rendering.backgroundColor;
    this.context.fillRect(0, 0, this.viewport.width, this.viewport.height);
  }

  private renderNebula(): void {
    const wisps = this.universe.nebula.wisps;
    const nebulaParallaxStrength = Universe.rendering.nebulaParallaxStrength;

    this.context.globalCompositeOperation = "screen";

    for (let wispIndex = 0; wispIndex < wisps.length; wispIndex += 1) {
      const wisp = wisps[wispIndex];

      worldToScreen(
        wisp,
        this.camera.state,
        this.viewport,
        nebulaParallaxStrength,
        this.nebulaScreenPoint,
      );

      const cullingRadius =
        wisp.radius * wisp.stretch * this.nebulaScreenPoint.scale +
        wisp.blur * this.nebulaScreenPoint.scale;

      if (
        !isScreenCircleVisible(
          this.nebulaScreenPoint,
          cullingRadius,
          this.viewport,
        )
      ) {
        continue;
      }

      drawNebula(this.context, wisp, this.nebulaScreenPoint);
    }

    this.context.shadowBlur = 0;
  }

  private renderStars(elapsedMilliseconds: number): void {
    const stars = this.universe.sky.stars;
    const starParallaxStrength = Universe.rendering.depthParallaxStrength;

    this.context.globalCompositeOperation = "lighter";

    for (let starIndex = 0; starIndex < stars.length; starIndex += 1) {
      const star = stars[starIndex];

      worldToScreen(
        star,
        this.camera.state,
        this.viewport,
        starParallaxStrength,
        this.starScreenPoint,
      );

      const cullingRadius =
        star.radius *
        this.starScreenPoint.scale *
        Universe.rendering.heroStarGlowMultiplier;

      if (
        !isScreenCircleVisible(
          this.starScreenPoint,
          cullingRadius,
          this.viewport,
        )
      ) {
        continue;
      }

      drawStar(
        this.context,
        star,
        this.starScreenPoint,
        elapsedMilliseconds,
      );
    }
  }
}