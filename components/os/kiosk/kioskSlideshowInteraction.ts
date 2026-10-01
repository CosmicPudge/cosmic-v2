export type KioskSwipeDirection = 1 | -1;

/** Returns next/previous direction for a valid horizontal gesture. */
export function resolveKioskSwipeDirection(
  deltaX: number,
  deltaY: number,
  threshold: number,
): KioskSwipeDirection | null {
  if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < threshold) return null;
  return deltaX < 0 ? 1 : -1;
}

/** Manual navigation starts a fresh full-duration automatic-rotation window. */
export function shouldResetKioskRotationAfterSwipe(): boolean {
  return true;
}
