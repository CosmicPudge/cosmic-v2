import { Universe } from "./Universe";
import type {
  CameraState,
  ScreenPoint,
  Vector2,
  Viewport,
  WorldObject,
} from "./types";

/**
 * Projects a world-space object into canvas-space coordinates.
 * The supplied target is mutated so rendering can remain allocation-free.
 */
export function worldToScreen(
  worldObject: WorldObject,
  camera: CameraState,
  viewport: Viewport,
  parallaxStrength: number,
  target: ScreenPoint,
): ScreenPoint {
  const renderingConfig = Universe.rendering;
  const depthRange =
    renderingConfig.projectionFarDepth - renderingConfig.projectionNearDepth;
  const normalizedDepth =
    (worldObject.depth - renderingConfig.projectionNearDepth) / depthRange;
  const parallaxOffset = normalizedDepth * parallaxStrength;

  const cameraRelativeX =
    worldObject.x - camera.positionX * (1 - parallaxOffset);
  const cameraRelativeY =
    worldObject.y - camera.positionY * (1 - parallaxOffset);

  const cosine = Math.cos(camera.rotation);
  const sine = Math.sin(camera.rotation);
  const rotatedX = cameraRelativeX * cosine - cameraRelativeY * sine;
  const rotatedY = cameraRelativeX * sine + cameraRelativeY * cosine;

  target.x = viewport.width * 0.5 + rotatedX * camera.zoom;
  target.y = viewport.height * 0.5 + rotatedY * camera.zoom;
  target.scale = camera.zoom * (1 - parallaxOffset);
  target.depth = worldObject.depth;

  return target;
}

/**
 * Checks whether a projected circular object intersects the visible viewport.
 */
export function isScreenCircleVisible(
  screenPoint: Vector2,
  radius: number,
  viewport: Viewport,
  padding: number = Universe.world.cullingPadding,
): boolean {
  const expandedRadius = radius + padding;

  return !(
    screenPoint.x + expandedRadius < 0 ||
    screenPoint.x - expandedRadius > viewport.width ||
    screenPoint.y + expandedRadius < 0 ||
    screenPoint.y - expandedRadius > viewport.height
  );
}