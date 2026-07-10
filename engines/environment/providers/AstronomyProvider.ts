import type { AstronomyData } from "../models/types";

const SYNODIC_MONTH = 29.530588853;

// Known New Moon
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export async function getAstronomy(): Promise<AstronomyData> {
  const now = Date.now();

  const daysSinceNewMoon =
    (now - KNOWN_NEW_MOON) / 1000 / 60 / 60 / 24;

  const moonAge =
    ((daysSinceNewMoon % SYNODIC_MONTH) + SYNODIC_MONTH) %
    SYNODIC_MONTH;

  const moonPhase = moonAge / SYNODIC_MONTH;

  const illumination =
    Math.round(
      ((1 - Math.cos(moonPhase * 2 * Math.PI)) / 2) * 100
    );

  let moonPhaseName = "";

  if (moonAge < 1.84566)
    moonPhaseName = "New Moon";
  else if (moonAge < 5.53699)
    moonPhaseName = "Waxing Crescent";
  else if (moonAge < 9.22831)
    moonPhaseName = "First Quarter";
  else if (moonAge < 12.91963)
    moonPhaseName = "Waxing Gibbous";
  else if (moonAge < 16.61096)
    moonPhaseName = "Full Moon";
  else if (moonAge < 20.30228)
    moonPhaseName = "Waning Gibbous";
  else if (moonAge < 23.99361)
    moonPhaseName = "Last Quarter";
  else if (moonAge < 27.68493)
    moonPhaseName = "Waning Crescent";
  else
    moonPhaseName = "New Moon";

  // Days until next full moon
  const fullMoonAge = 14.765;

  let daysUntilFull =
    fullMoonAge - moonAge;

  if (daysUntilFull < 0)
    daysUntilFull += SYNODIC_MONTH;

  // Days until next new moon
  let daysUntilNew =
    SYNODIC_MONTH - moonAge;

  const nextFullMoon = new Date(
    now + daysUntilFull * 86400000
  );

  const nextNewMoon = new Date(
    now + daysUntilNew * 86400000
  );

  return {
    moonPhase,

    moonPhaseName,

    illumination,

    // Placeholder for now
    moonrise: 0,
    moonset: 0,

    nextFullMoon:
      nextFullMoon.toLocaleDateString(),

    nextNewMoon:
      nextNewMoon.toLocaleDateString(),
  };
}