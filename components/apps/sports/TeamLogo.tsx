"use client";

import Image from "next/image";

interface TeamLogoProps {
  league: string;
  team: string;
  size?: number;
}

export default function TeamLogo({
  league,
  team,
  size = 48,
}: TeamLogoProps) {
  return (
    <Image
      src={`/logos/${league}/${team}.svg`}
      alt={team}
      width={size}
      height={size}
      className="select-none object-contain"
      priority={false}
      unoptimized
    />
  );
}