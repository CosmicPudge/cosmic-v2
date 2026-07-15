"use client";

interface Props {
  progress: number;
}

export default function BootProgress({
  progress,
}: Props) {
  return (
    <div className="mt-8 w-72">
      <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
        <div
          className="
            h-full
            origin-left
            bg-gradient-to-r
            from-sky-400
            via-cyan-300
            to-violet-400
            transition-[width]
            duration-100
            ease-linear
          "
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}