export type DisplayProfile =
  | "pocket"
  | "compact"
  | "comfortable"
  | "expanded";

export interface DisplayMetrics {
  width: number;
  height: number;

  aspectRatio: number;

  touch: boolean;

  profile: DisplayProfile;
}

export interface DisplayTokens {
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  widgetGap: number;

  iconScale: number;

  fontScale: number;

  blur: number;
}

export interface DisplayContextValue extends DisplayMetrics {
  tokens: DisplayTokens;
}