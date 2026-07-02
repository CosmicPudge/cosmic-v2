"use client";

import GradientLayer from "../effects/GradientLayer";
import ParticlesLayer from "../effects/ParticlesLayer";

interface Props {
  context?: unknown;
}

export default function WeatherScene({
  context,
}: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden">

      <GradientLayer variant="sunny" />

      <ParticlesLayer
        count={70}
        size={2}
        opacity={0.25}
      />

    </div>
  );
}