"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}


export default function AppHeader({
  title,
  subtitle,
}: AppHeaderProps) {

    const router = useRouter();
    
  return (
    <header className="mb-10 flex items-center justify-between">

      <div>

        <button
  onClick={() => router.push("/os")}
  className="mb-4 inline-flex items-center gap-2 text-white/60 transition hover:text-white"
>
  <ArrowLeft size={18} />
  Dashboard
</button>

        <h1 className="text-5xl font-black tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 text-lg text-white/50">
            {subtitle}
          </p>
        )}

      </div>

    </header>
  );
}