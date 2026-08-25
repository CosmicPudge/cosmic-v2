"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCosmicTransition } from "@/components/os/transition";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}


export default function AppHeader({
  title,
  subtitle,
}: AppHeaderProps) {

    const { prefetch } = useCosmicTransition();
    
  return (
    <header className="cosmic-app-header mb-5 flex items-end justify-between gap-4 sm:mb-7">

      <div>

        <Link
  href="/os"
  onMouseEnter={() => prefetch("/os")}
  onFocus={() => prefetch("/os")}
className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45 transition hover:text-cyan-100"
>
  <ArrowLeft size={18} />
  Dashboard
</Link>

        <p className="cosmic-kicker">Cosmic OS · module interface</p>
        <h1 className="mt-3 text-[clamp(2.5rem,7vw,5rem)] font-light leading-none tracking-[0.12em] text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm uppercase tracking-[0.18em] text-violet-200/70 sm:text-base">
            {subtitle}
          </p>
        )}

      </div>

    </header>
  );
}
