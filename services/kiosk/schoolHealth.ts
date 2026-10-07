type SchoolHealthInput = {
  error?: string;
  kioskSource?: "account-provider" | "kiosk-canvas-ical";
  snapshot?: { sourceStatus?: { canvas?: string } };
};

/** Any successful kiosk School source is healthy, including the iCal fallback. */
export function isDeveloperKioskSchoolConnected(value: SchoolHealthInput): boolean {
  return !value.error && (value.kioskSource === "kiosk-canvas-ical" || value.snapshot?.sourceStatus?.canvas === "healthy");
}
