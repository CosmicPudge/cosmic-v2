import type { AstronomyData } from "../models/types";

export async function getAstronomy(): Promise<AstronomyData> {

  return {
    moonPhase: 0,

    moonPhaseName: "Unknown",

    illumination: 0,

    moonrise: 0,

    moonset: 0,

    nextFullMoon: "",

    nextNewMoon: "",
  };

}