import type { ReactNode } from "react";

export default function KioskSceneFrame({ scene, eyebrow, title, subtitle, children }: { scene: string; eyebrow: string; title: string; subtitle?: string; children?: ReactNode }) {
  return <section className={`kiosk-native-scene kiosk-native-scene-${scene}`} data-kiosk-native-scene={scene}>
    <div className="kiosk-native-scene-header"><span className="kiosk-native-scene-dot" />{eyebrow}</div>
    <div className="kiosk-native-scene-main"><p className="kiosk-native-scene-title">{title}</p>{subtitle && <p className="kiosk-native-scene-subtitle">{subtitle}</p>}{children}</div>
  </section>;
}
