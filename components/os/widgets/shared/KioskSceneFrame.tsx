import type { ReactNode } from "react";
import Image from "next/image";
import KioskSceneIdentity from "./KioskSceneIdentity";
import KioskDynamicBackground from "./KioskDynamicBackground";

export default function KioskSceneFrame({ scene, eyebrow, title, subtitle, backgroundImage, backgroundState, backgroundVariant, children }: { scene: string; eyebrow: string; title: string; subtitle?: string; backgroundImage?: string; backgroundState?: string; backgroundVariant?: string; children?: ReactNode }) {
  return <section className={`kiosk-native-scene kiosk-native-scene-${scene}`} data-kiosk-native-scene={scene}>
    {backgroundImage && <Image className="kiosk-native-scene-background" src={backgroundImage} alt="" aria-hidden fill sizes="100vw" />}
    <KioskDynamicBackground scene={scene} state={backgroundState} variant={backgroundVariant} />
    <KioskSceneIdentity sceneLabel={eyebrow} />
    <div className="kiosk-native-scene-main"><p className="kiosk-native-scene-title">{title}</p>{subtitle && <p className="kiosk-native-scene-subtitle">{subtitle}</p>}{children}</div>
  </section>;
}
