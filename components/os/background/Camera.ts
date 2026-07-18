import { Universe } from "./Universe";
import type { CameraState, UniverseSettings } from "./types";

/**
 * Maintains the world-space viewpoint used by the canvas renderer.
 * The camera state object is mutated in place to avoid frame allocations.
 */
export class Camera {
  public readonly state: CameraState;

  private readonly universe: UniverseSettings;
  private basePositionX: number;
  private basePositionY: number;

  public constructor(universe: UniverseSettings = Universe) {
    this.universe = universe;
    this.basePositionX = universe.camera.initialPositionX;
    this.basePositionY = universe.camera.initialPositionY;

    this.state = {
      positionX: this.basePositionX,
      positionY: this.basePositionY,
      zoom: universe.camera.initialZoom,
      rotation: 0,
    };
  }

  /**
   * Advances the ambient camera motion using elapsed animation time.
   */
  public update(elapsedMilliseconds: number): void {
    const cameraConfig = this.universe.camera;

    this.state.positionX =
      this.basePositionX +
      Math.sin(elapsedMilliseconds * cameraConfig.driftSpeedX) *
        cameraConfig.driftAmplitudeX;

    this.state.positionY =
      this.basePositionY +
      Math.cos(elapsedMilliseconds * cameraConfig.driftSpeedY) *
        cameraConfig.driftAmplitudeY;

    this.state.rotation =
      Math.sin(elapsedMilliseconds * cameraConfig.rotationSpeed) *
      cameraConfig.rotationAmplitude;
  }

  /**
   * Sets the persistent center point around which ambient drift occurs.
   */
  public setPosition(positionX: number, positionY: number): void {
    this.basePositionX = positionX;
    this.basePositionY = positionY;
    this.state.positionX = positionX;
    this.state.positionY = positionY;
  }

  /**
   * Applies a bounded zoom value.
   */
  public setZoom(zoom: number): void {
    this.state.zoom = Math.min(
      this.universe.camera.maximumZoom,
      Math.max(this.universe.camera.minimumZoom, zoom),
    );
  }

  public reset(): void {
    this.basePositionX = this.universe.camera.initialPositionX;
    this.basePositionY = this.universe.camera.initialPositionY;
    this.state.positionX = this.basePositionX;
    this.state.positionY = this.basePositionY;
    this.state.zoom = this.universe.camera.initialZoom;
    this.state.rotation = 0;
  }
}