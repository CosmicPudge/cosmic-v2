"use client";

interface Props {
  context?: unknown;
}

export default function DefaultScene({
  context,
}: Props) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-950 to-black" />

    </div>
  );
}