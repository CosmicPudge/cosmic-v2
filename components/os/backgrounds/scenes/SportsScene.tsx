"use client";

interface Props {
  context?: unknown;
}

export default function SportsScene({
  context,
}: Props) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-neutral-950 to-black" />

      {/* Future:
          Baseball
          Football
          NASCAR
          Formula 1
      */}

    </div>
  );
}