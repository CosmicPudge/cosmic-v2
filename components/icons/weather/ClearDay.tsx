"use client";

import IconCanvas from "../primitives/IconCanvas";
import Glow from "../primitives/Glow";
import Motion from "../primitives/Motion";
import Sun from "../primitives/Sun";

import { Colors } from "@/design-system/tokens/colors";

interface Props {
    size?: number;
}

export default function ClearDay({
    size = 64,
}: Props) {
    return (
        <IconCanvas size={size}>
            <Glow
                color={Colors.weather.sunGlow}
                size={18}
            >
                <Motion
                    type="pulse"
                    duration={10}
                >
                    <Motion
                        type="spin"
                        duration={60}
                    >
                        <Sun size={size} />
                    </Motion>
                </Motion>
            </Glow>
        </IconCanvas>
    );
}