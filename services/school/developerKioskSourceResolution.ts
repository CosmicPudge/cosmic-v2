export interface DeveloperKioskSchoolSourceResolution<T> {
  value?: T;
  source: "account-provider" | "kiosk-canvas-ical";
  accountProviderSucceeded: boolean;
  canvasIcalConfigured: boolean;
  canvasIcalAttempted: boolean;
  canvasIcalSucceeded: boolean;
}

/** Resolve the kiosk-only source order without making provider failures terminal. */
export async function resolveDeveloperKioskSchoolSources<T>(options: {
  accountProvider: () => Promise<T>;
  accountProviderUsable: (value: T) => boolean;
  canvasIcalConfigured: boolean;
  canvasIcalProvider: () => Promise<T>;
}): Promise<DeveloperKioskSchoolSourceResolution<T>> {
  let accountValue: T | undefined;
  try {
    accountValue = await options.accountProvider();
    if (options.accountProviderUsable(accountValue)) {
      return { value: accountValue, source: "account-provider", accountProviderSucceeded: true, canvasIcalConfigured: options.canvasIcalConfigured, canvasIcalAttempted: false, canvasIcalSucceeded: false };
    }
  } catch {
    // Continue to the kiosk feed; provider failures are not terminal here.
  }
  if (!options.canvasIcalConfigured) return { value: accountValue, source: "account-provider", accountProviderSucceeded: false, canvasIcalConfigured: false, canvasIcalAttempted: false, canvasIcalSucceeded: false };
  try {
    return { value: await options.canvasIcalProvider(), source: "kiosk-canvas-ical", accountProviderSucceeded: false, canvasIcalConfigured: true, canvasIcalAttempted: true, canvasIcalSucceeded: true };
  } catch {
    return { value: accountValue, source: "kiosk-canvas-ical", accountProviderSucceeded: false, canvasIcalConfigured: true, canvasIcalAttempted: true, canvasIcalSucceeded: false };
  }
}
