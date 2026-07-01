"use client";

interface PlayTickerProps {
  play: string;
}

export default function PlayTicker({
  play,
}: PlayTickerProps) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">

      <p className="text-xs uppercase tracking-wider text-white/40">
        Latest Play
      </p>

      <p className="mt-3 text-lg leading-relaxed">
        {play}
      </p>

    </div>
  );
}