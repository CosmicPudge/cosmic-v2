import { NavigationEngine } from "@/engines/navigation";

declare global {
  var cosmicNavigation:
    | NavigationEngine
    | undefined;
}

export const navigation =
  globalThis.cosmicNavigation ??
  new NavigationEngine();

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalThis.cosmicNavigation =
    navigation;
}