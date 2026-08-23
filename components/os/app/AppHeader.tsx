"use client";

import { useRouter } from "next/navigation";
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

    const router = useRouter();
    const { prefetch } = useCosmicTransition();
    
  return (
    <header className="mb-6 flex items-center justify-between sm:mb-10">

      <div>

        <button
  onMouseEnter={() => prefetch("/os")}
  onFocus={() => prefetch("/os")}
  onClick={() => router.push("/os")}
  className="mb-4 inline-flex items-center gap-2 text-white/60 transition hover:text-white"
>
  <ArrowLeft size={18} />
  Dashboard
</button>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 text-base text-white/50 sm:text-lg">
            {subtitle}
          </p>
        )}

      </div>

    </header>
  );
}
