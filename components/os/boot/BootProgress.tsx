"use client";

interface Props {
  start: boolean;
}

export default function BootProgress({
  start,
}: Props) {
  return (
    <div className="mt-8 w-72">
      <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
        <div
  className={`
    h-full
    w-full
    origin-left

    bg-gradient-to-r
    from-sky-400
    via-cyan-300
    to-violet-400

    ${start ? "animate-cosmic-progress" : ""}
  `}
/>
      </div>
    </div>
  );
}