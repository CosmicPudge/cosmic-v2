import type { UniverseSettings } from "./Universe";

export type { UniverseSettings } from "./Universe";

export type StarPopulation = "hero" | "bright" | "normal" | "micro";

export interface Vector2 {
  x: number;
  y: number;
}

export interface WorldObject extends Vector2 {
  depth: number;
}

export interface Star extends WorldObject {
  id: number;
  population: StarPopulation;
  radius: number;
  color: string;
  opacity: number;
  twinkleOffset: number;
  twinkleSpeed: number;
  twinkleStrength: number;
}

export interface NebulaWisp extends WorldObject {
  id: number;
  layer: number;
  radius: number;
  rotation: number;
  stretch: number;
  opacity: number;
  blur: number;
  color: string;
}

export interface Sky {
  stars: Star[];
}

export interface Nebula {
  wisps: NebulaWisp[];
}

export interface GeneratedUniverse {
  sky: Sky;
  nebula: Nebula;
}

export interface CameraState {
  positionX: number;
  positionY: number;
  zoom: number;
  rotation: number;
}

export interface Viewport {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
  scale: number;
  depth: number;
}

export interface ProjectedStar extends Star, ScreenPoint {}

export interface ProjectedNebulaWisp extends NebulaWisp, ScreenPoint {}

export interface FrameState {
  elapsedMilliseconds: number;
  deltaMilliseconds: number;
}

export interface RendererDependencies {
  universe: UniverseSettings;
  context: CanvasRenderingContext2D;
}