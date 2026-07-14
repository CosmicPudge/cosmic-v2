"use client";

interface Props {
  message: string;
}

export default function BootMessage({
  message,
}: Props) {
  return (
    <div className="mt-8 flex items-center gap-3">

      <div
        className="
          h-2
          w-2
          rounded-full

          bg-cyan-400

          animate-pulse
        "
      />

      <p
        className="
          text-xs
          uppercase
          tracking-[0.35em]

          text-white/60
        "
      >
        {message}
      </p>

    </div>
  );
}