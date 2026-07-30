import type {
  WidgetDisplayMode,
  WidgetFootprint,
} from "./types";

export function getDisplayMode(
  footprint: WidgetFootprint
): WidgetDisplayMode {
  const { rows, cols } = footprint;

  if (rows === 1 && cols <= 2) {
    return "compact";
  }

  if (
    (rows === 1 && cols >= 3) ||
    (rows === 2 && cols <= 2)
  ) {
    return "medium";
  }

  if (rows === 2 && cols === 3) {
    return "expanded";
  }

  return "hero";
}