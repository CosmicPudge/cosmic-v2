import { CosmicHudService } from "./glasses/hud/hudService";

const hud =
  await CosmicHudService.create();

console.log(
  "COSMIC Glasses ready",
  hud,
);