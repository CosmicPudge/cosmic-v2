"use client";

interface Props {
  time: string;
  temp: number;
}

export default function HourlyForecastCard({
  time,
  temp,
}: Props) {
  return (
    <div
      className="
        w-28
        shrink-0
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        p-5
        text-center
        transition-all
        duration-300
        hover:bg-white/10
        hover:scale-105
      "
    >
      <p className="text-sm text-white/60">
        {time}
      </p>

      <div className="my-4 text-4xl">
        ☀️
      </div>

      <p className="text-2xl font-bold">
        {temp}°
      </p>
    </div>
  );
}