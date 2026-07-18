import type { NebulaWisp, ScreenPoint } from "./types";

const FULL_TURN_RADIANS = Math.PI * 2;

/**
 * Draws one projected interstellar-gas wisp.
 * Overlapping wisps create the nebula volume; this function does not cull.
 */
export function drawNebula(
  context: CanvasRenderingContext2D,
  wisp: NebulaWisp,
  screenPoint: ScreenPoint,
): void {
  const radius = wisp.radius * screenPoint.scale;
  const horizontalRadius = radius * wisp.stretch;
  const depthOpacity = 1 - wisp.depth;

  context.fillStyle = wisp.color;
  context.shadowColor = wisp.color;
  context.shadowBlur = wisp.blur * screenPoint.scale;
  context.globalAlpha = wisp.opacity * depthOpacity;

  context.beginPath();
  context.ellipse(
    screenPoint.x,
    screenPoint.y,
    horizontalRadius,
    radius,
    wisp.rotation,
    0,
    FULL_TURN_RADIANS,
  );
  context.fill();
}