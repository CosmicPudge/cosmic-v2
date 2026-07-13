"use client";

import IconCanvas from "@/components/icons/primitives/IconCanvas";

interface Props {
  size?: number;
  className?: string;
}

export default function Home({
  size = 24,
  className = "",
}: Props) {
  return (
    <IconCanvas
      size={size}
      className={className}
    >
      {/* Roof */}
      <path
        d="M24 44L50 22L76 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* House */}
      <path
        d="M30 42V74H70V42"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Door */}
      <path
        d="M44 74V56H56V74"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconCanvas>
  );
}