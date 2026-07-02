"use client";

interface Props {
  variant:
    | "space"
    | "sunny"
    | "cloudy"
    | "rain"
    | "storm"
    | "snow"
    | "night"
    | "stadium"
    | "garage"
    | "calendar"
    | "assistant";
}

const gradients = {
  space:
    "from-slate-950 via-indigo-950 to-black",

  sunny:
    "from-sky-400 via-blue-500 to-slate-900",

  cloudy:
    "from-slate-400 via-slate-700 to-slate-950",

  rain:
    "from-slate-700 via-slate-900 to-black",

  storm:
    "from-zinc-700 via-slate-950 to-black",

  snow:
    "from-sky-100 via-slate-300 to-slate-900",

  night:
    "from-indigo-950 via-slate-950 to-black",

  stadium:
    "from-zinc-900 via-neutral-950 to-black",

  garage:
    "from-zinc-800 via-neutral-950 to-black",

  calendar:
    "from-indigo-700 via-slate-900 to-black",

  assistant:
    "from-cyan-700 via-slate-900 to-black",
};

export default function GradientLayer({
  variant,
}: Props) {
  return (
    <div
      className={`
        absolute inset-0
        bg-gradient-to-b
        ${gradients[variant]}
      `}
    />
  );
}