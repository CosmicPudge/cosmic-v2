"use client";

import IconCanvas from "../primitives/IconCanvas";
import Motion from "../primitives/Motion";
import Cloud from "../primitives/Cloud";
import RainField from "@/components/effects/particles/RainField";
interface Props {
  size?: number;
}

export default function Rain({
  size = 64,
}: Props) {
  return (
    <IconCanvas size={size}>
      <Motion
        type="float"
        duration={10}
      >
        <Cloud size={size} />
      </Motion>

      <Motion
        type="rain"
      >
        <RainField drops={8} />
      </Motion>
    </IconCanvas>
  );
}