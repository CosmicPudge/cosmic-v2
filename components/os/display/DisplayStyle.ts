import type { CSSProperties } from "react";

import type { DisplayTokens } from "./types";

export function createDisplayStyles(
  tokens: DisplayTokens
) {
  const vars: CSSProperties = {
    "--cosmic-space-xs": `${tokens.spacing.xs}px`,
    "--cosmic-space-sm": `${tokens.spacing.sm}px`,
    "--cosmic-space-md": `${tokens.spacing.md}px`,
    "--cosmic-space-lg": `${tokens.spacing.lg}px`,
    "--cosmic-space-xl": `${tokens.spacing.xl}px`,

    "--cosmic-radius-sm": `${tokens.radius.sm}px`,
    "--cosmic-radius-md": `${tokens.radius.md}px`,
    "--cosmic-radius-lg": `${tokens.radius.lg}px`,
    "--cosmic-radius-xl": `${tokens.radius.xl}px`,

    "--cosmic-widget-gap": `${tokens.widgetGap}px`,

    "--cosmic-icon-scale": `${tokens.iconScale}`,

    "--cosmic-font-scale": `${tokens.fontScale}`,

    "--cosmic-glass-blur": `${tokens.blur}px`,
  } as CSSProperties;

  return vars;
}