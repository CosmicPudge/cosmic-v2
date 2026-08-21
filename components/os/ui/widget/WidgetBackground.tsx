"use client";

import clsx from "clsx";

import { useDisplay } from "@/components/os/display";

import type { WidgetAccent } from "./types";

interface Props {
  accent: WidgetAccent;
}

const BACKGROUNDS: Record<WidgetAccent, string> = {
  default:
    "from-white/8 via-transparent to-transparent",

  weather:
    "from-sky-500/25 via-cyan-400/12 to-transparent",

  calendar:
    "from-violet-500/22 via-fuchsia-400/12 to-transparent",

  sports:
    "from-green-500/22 via-emerald-400/12 to-transparent",

  garage:
    "from-orange-500/22 via-red-400/12 to-transparent",

  school:
    "from-blue-500/22 via-sky-400/12 to-transparent",

  cosmic:
    "from-cyan-500/25 via-indigo-500/15 to-transparent",

  projects:
    "from-purple-500/22 via-violet-400/12 to-transparent",

  notifications:
    "from-red-500/22 via-orange-400/12 to-transparent",

  notes:
    "from-yellow-500/20 via-amber-400/12 to-transparent",

  outlook:
    "from-indigo-500/22 via-blue-400/12 to-transparent",

  system:
    "from-slate-500/18 via-zinc-400/10 to-transparent",

  music:
    "from-pink-500/22 via-purple-500/12 to-transparent",

  search:
    "from-teal-500/22 via-cyan-400/12 to-transparent",

  briefing:
    "from-fuchsia-500/22 via-pink-400/12 to-transparent",

  clock:
    "from-zinc-500/18 via-slate-400/10 to-transparent",

  finance:
    "from-emerald-500/22 via-cyan-400/12 to-transparent",
};

export default function WidgetBackground({
  accent,
}: Props) {
  const { tokens } = useDisplay();

  return (
    <>
      {/* Main Accent */}
      <div
        className={clsx(
          "absolute inset-0 bg-gradient-to-br",
          BACKGROUNDS[accent]
        )}
      />

      {/* Light Bloom */}
      <div
        className="
          absolute
          -left-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-white/10
        "
        style={{
          filter: `blur(${tokens.blur * 2}px)`,
        }}
      />

      {/* Secondary Glow */}
      <div
        className="
          absolute
          bottom-0
          right-0
          h-56
          w-56
          rounded-full
          bg-white/[0.04]
        "
        style={{
          filter: `blur(${tokens.blur * 2}px)`,
        }}
      />

      {/* Ambient Highlight */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-b
          from-white/[0.08]
          via-transparent
          to-transparent
        "
      />

      {/* Bottom Shadow */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/10
          via-transparent
          to-transparent
        "
      />
    </>
  );
}
