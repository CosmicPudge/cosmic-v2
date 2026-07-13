"use client";

import Home from "./glyphs/Home";

export type CosmicGlyph =
  | "home";

interface Props {
  glyph: CosmicGlyph;
  size?: number;
  className?: string;
}

export default function CosmicIcon({
  glyph,
  size = 24,
  className,
}: Props) {
  switch (glyph) {
    case "home":
      return (
        <Home
          size={size}
          className={className}
        />
      );

    default:
      return null;
  }
}