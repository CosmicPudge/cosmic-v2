"use client";

import useKioskPresentationLifecycle from "./useKioskPresentation";

/** @deprecated The idle presentation is now the shared Kiosk renderer. */
export default function useIdleAmbient() {
  useKioskPresentationLifecycle();
}
