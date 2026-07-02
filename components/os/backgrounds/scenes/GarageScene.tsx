"use client";

interface Props {
  context?: unknown;
}

export default function GarageScene({
  context,
}: Props) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-neutral-950 to-black" />

    </div>
  );
}