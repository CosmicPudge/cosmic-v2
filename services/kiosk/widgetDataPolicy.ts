export type KioskWidgetPresentation = "dashboard" | "kiosk";

/** The standalone kiosk has one aggregate data coordinator for these providers. */
export function shouldLoadDashboardWidgetProvider(presentation: KioskWidgetPresentation) {
  return presentation !== "kiosk";
}
