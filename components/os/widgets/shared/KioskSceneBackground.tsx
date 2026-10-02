import Image from "next/image";
import type { KioskSceneFamily } from "./kioskSceneBackgrounds";
import { selectKioskSceneBackground } from "./kioskSceneBackgrounds";

export default function KioskSceneBackground({ family, state = "steady", variant = "default", image }: { family: KioskSceneFamily; state?: string; variant?: string; image?: string }) {
  const source = image ?? selectKioskSceneBackground(family, state, variant);
  return <div className={`kiosk-scene-background kiosk-scene-background-${family}`} data-scene-state={state} data-scene-variant={variant} aria-hidden="true">
    <Image className="kiosk-scene-background-image" src={source} alt="" fill sizes="100vw" priority />
    <span className="kiosk-scene-background-shade" />
    <span className="kiosk-scene-background-motion" />
  </div>;
}
