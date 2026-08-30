import type { ReactNode } from "react";
import Image from "next/image";

export default function KioskSceneFrame({ scene, eyebrow, title, subtitle, backgroundImage, children }: { scene: string; eyebrow: string; title: string; subtitle?: string; backgroundImage?: string; children?: ReactNode }) {
  return <section className={`kiosk-native-scene kiosk-native-scene-${scene}`} data-kiosk-native-scene={scene}>
    {backgroundImage && <Image className="kiosk-native-scene-background" src={backgroundImage} alt="" aria-hidden fill sizes="100vw" />}
    <div className="kiosk-native-scene-header"><span className="kiosk-native-scene-dot" />{eyebrow}</div>
    <div className="kiosk-native-scene-main"><p className="kiosk-native-scene-title">{title}</p>{subtitle && <p className="kiosk-native-scene-subtitle">{subtitle}</p>}{children}</div>
  </section>;
}
