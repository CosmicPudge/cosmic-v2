import type { CSSProperties } from "react";

export default function KioskDynamicBackground({ scene, state = "steady", variant = "default" }: { scene: string; state?: string; variant?: string }) {
  const style = { "--kiosk-background-intensity": state === "urgent" || state === "live" || state === "offline" ? 1 : .62 } as CSSProperties;
  return <div className={`kiosk-dynamic-background kiosk-dynamic-background-${scene}`} data-background-state={state} data-background-variant={variant} style={style} aria-hidden="true">
    <span className="kiosk-dynamic-background-grid" />
    <span className="kiosk-dynamic-background-orbit kiosk-dynamic-background-orbit-one" />
    <span className="kiosk-dynamic-background-orbit kiosk-dynamic-background-orbit-two" />
    <span className="kiosk-dynamic-background-node kiosk-dynamic-background-node-one" />
    <span className="kiosk-dynamic-background-node kiosk-dynamic-background-node-two" />
    <span className="kiosk-dynamic-background-node kiosk-dynamic-background-node-three" />
    <span className="kiosk-dynamic-background-sweep" />
  </div>;
}
