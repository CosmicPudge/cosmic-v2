import type { ReactNode } from "react";
import type { SportsEvent } from "@/core/contracts/Sports";
import { normalizeKioskSportsEvent } from "@/services/sports/kioskSelection";
import KioskSceneBackground from "@/components/os/widgets/shared/KioskSceneBackground";
import { selectKioskSportsBackground } from "@/components/os/widgets/shared/kioskSceneBackgrounds";

export function getKioskSportsScenePresentation(event: SportsEvent) {
  const normalized = normalizeKioskSportsEvent(event);
  const backgroundKey = normalized?.backgroundKey;
  const backgroundImage = selectKioskSportsBackground(backgroundKey);
  const backgroundSource = backgroundKey?.endsWith("-generic") ? "generic-fallback" : backgroundKey ? "exact-venue" : "generic-fallback";
  return {
    backgroundKey,
    backgroundImage,
    backgroundSource,
    state: normalized?.live ? "live" : "upcoming",
  } as const;
}

export default function KioskSportsScene({ event, celebration, children }: { event: SportsEvent; celebration?: ReactNode; children: ReactNode }) {
  const presentation = getKioskSportsScenePresentation(event);
  return (
    <div
      className="kiosk-sports-scene relative h-full min-h-0 w-full overflow-hidden"
      data-kiosk-sports-scene
      data-sport={event.sport}
      data-background-key={presentation.backgroundKey ?? "generic"}
      data-background-source={presentation.backgroundSource}
      data-glass-layout="shared"
    >
      <KioskSceneBackground family="sports" state={presentation.state} image={presentation.backgroundImage} />
      <div className="kiosk-sports-scene-content relative z-10 h-full min-h-0 w-full">{children}</div>
      {celebration}
    </div>
  );
}
