"use client";

import Cloud from "../primitives/Cloud";
import IconCanvas from "../primitives/IconCanvas";
import Motion from "../primitives/Motion";

interface Props {
  size?: number;
}

export default function Cloudy({
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
    </IconCanvas>
  );
}