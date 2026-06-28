"use client";

import Gradient from "./Gradient";
import Stars from "./Stars";
import Nebula from "./Nebula";
import AmbientGlow from "./AmbientGlow";

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Gradient />
      <Nebula />
      <Stars />
      <AmbientGlow />
    </div>
  );
}