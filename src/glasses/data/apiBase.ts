export function selectCosmicApiBase(configuredBase?: string | null) {
  const configured = configuredBase?.trim();
  return configured || "/api/glasses";
}

// The default is same-origin so production requests retain the Cosmic session
// cookie. Local Vite development reaches cosmic-v2 through vite.config.ts.
type ViteEnv = { VITE_COSMIC_API_BASE?: string };

const viteEnv: ViteEnv = (import.meta as ImportMeta & {
  env?: { VITE_COSMIC_API_BASE?: string };
}).env ?? {};

export const cosmicApiBase = selectCosmicApiBase(
  viteEnv.VITE_COSMIC_API_BASE,
);

export function cosmicApi(path: string) {
  return `${cosmicApiBase}/${path}`;
}
