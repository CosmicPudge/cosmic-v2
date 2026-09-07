export const PHONE_HUD_WIDTH = 576;
export const PHONE_HUD_HEIGHT = 288;

export function logicalStageScale(
  viewportWidth: number,
  viewportHeight: number,
  calibrationScale = 1,
) {
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return 1;
  }

  return Math.min(
    viewportWidth / PHONE_HUD_WIDTH,
    viewportHeight / PHONE_HUD_HEIGHT,
  ) * calibrationScale;
}

export function nextFixtureStep(
  currentStep: number,
  delta: number,
  stepCount: number,
) {
  if (!Number.isInteger(stepCount) || stepCount <= 0) return 0;
  return Math.max(
    0,
    Math.min(stepCount - 1, currentStep + delta),
  );
}
