export const CELESTIAL_DAY_SECONDS = 86_400;
export function getLocalSecondsIntoDay(date = new Date()): number { return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000; }
export function getCelestialPhase(date = new Date()): number { return getLocalSecondsIntoDay(date) / CELESTIAL_DAY_SECONDS; }
export function getCelestialRotation(date = new Date()): number { return getCelestialPhase(date) * 360; }
