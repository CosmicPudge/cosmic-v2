import { Universe } from "./Universe";
import type { ScreenPoint, Star } from "./types";

/**
 * Draws one already-projected star.
 * Culling and projection are intentionally handled by the renderer.
 */
export function drawStar(
  context: CanvasRenderingContext2D,
  star: Star,
  screenPoint: ScreenPoint,
  elapsedMilliseconds: number,
): void {
  const renderingConfig = Universe.rendering;
  const twinkle =
    1 +
    Math.sin(
      elapsedMilliseconds * star.twinkleSpeed + star.twinkleOffset,
    ) *
      star.twinkleStrength;
  const radius = star.radius * screenPoint.scale * twinkle;
  const opacity = getStarOpacity(star) * twinkle;
  const glowMultiplier =
    star.population === "hero"
      ? renderingConfig.heroStarGlowMultiplier
      : renderingConfig.starGlowMultiplier;

  context.fillStyle = star.color;
  context.globalAlpha = opacity / glowMultiplier;
  context.beginPath();
  context.arc(
    screenPoint.x,
    screenPoint.y,
    radius * glowMultiplier,
    0,
    Math.PI * 2,
  );
  context.fill();

  context.globalAlpha = opacity;
  context.beginPath();
  context.arc(screenPoint.x, screenPoint.y, radius, 0, Math.PI * 2);
  context.fill();

  if (star.population === "hero") {
    drawHeroStarSpikes(context, star, screenPoint, radius, opacity);
  }
}

function drawHeroStarSpikes(
  context: CanvasRenderingContext2D,
  star: Star,
  screenPoint: ScreenPoint,
  radius: number,
  opacity: number,
): void {
  const renderingConfig = Universe.rendering;
  const spikeLength = radius * renderingConfig.heroSpikeLengthMultiplier;

  context.strokeStyle = star.color;
  context.lineWidth = renderingConfig.heroSpikeWidth;
  context.globalAlpha = opacity / renderingConfig.heroStarGlowMultiplier;
  context.beginPath();
  context.moveTo(screenPoint.x - spikeLength, screenPoint.y);
  context.lineTo(screenPoint.x + spikeLength, screenPoint.y);
  context.moveTo(screenPoint.x, screenPoint.y - spikeLength);
  context.lineTo(screenPoint.x, screenPoint.y + spikeLength);
  context.stroke();
}

function getStarOpacity(star: Star): number {
  if (star.population === "normal") {
    return star.opacity * Universe.rendering.normalStarAlphaMultiplier;
  }

  if (star.population === "micro") {
    return star.opacity * Universe.rendering.microStarAlphaMultiplier;
  }

  return star.opacity;
}