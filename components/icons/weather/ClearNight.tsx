"use client";

import IconCanvas from "../primitives/IconCanvas";
import Glow from "../primitives/Glow";
import Motion from "../primitives/Motion";
import Moon from "../primitives/Moon";
import Stars from "../primitives/Stars";

import { Colors } from "@/design-system/tokens/colors";

interface Props {
  size?: number;

  starDensity?: "sparse" | "normal" | "dense";
}

export default function ClearNight({
  size = 48,
  starDensity = "normal",
}: Props) {
  return (
    <IconCanvas size={size}>

  <Stars density={starDensity} />

  <Glow
    color={Colors.weather.moonGlow}
    size={10}
  >
    <Motion
      type="float"
      duration={12}
    >
      <Moon size={size} />
    </Motion>
  </Glow>

</IconCanvas>
  );
}
