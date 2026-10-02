import type { ReactNode } from "react";
import KioskSceneIdentity from "./KioskSceneIdentity";
import KioskSceneBackground from "./KioskSceneBackground";
import type { KioskSceneFamily } from "./kioskSceneBackgrounds";

export default function KioskSceneFrame({ scene, eyebrow, title, subtitle, backgroundImage, backgroundState, backgroundVariant, children }: { scene: string; eyebrow: string; title: ReactNode; subtitle?: ReactNode; backgroundImage?: string; backgroundState?: string; backgroundVariant?: string; children?: ReactNode }) {
  return <section className={`kiosk-native-scene kiosk-native-scene-${scene}`} data-kiosk-native-scene={scene}>
    {(["school", "sports", "system"].includes(scene) || backgroundImage) && <KioskSceneBackground family={(scene === "school" || scene === "sports" || scene === "system" ? scene : "system") as KioskSceneFamily} state={backgroundState} variant={backgroundVariant} image={backgroundImage} />}
    <KioskSceneIdentity sceneLabel={eyebrow} />
    <div className="kiosk-native-scene-main"><p className="kiosk-native-scene-title">{title}</p>{subtitle && <p className="kiosk-native-scene-subtitle">{subtitle}</p>}{children}</div>
  </section>;
}
