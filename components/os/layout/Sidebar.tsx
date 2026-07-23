"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { apps } from "@/config/apps";
import { useBoot } from "@/components/os/boot/BootManager";

export default function Sidebar() {
  const router = useRouter();
  const { complete } = useBoot();

  useEffect(() => {
    complete("sidebar");
  }, [complete]);

  return (
    <aside className="w-20 border-r border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="flex h-full flex-col items-center gap-5 py-6">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => router.push(app.route)}
            className="
              flex h-12 w-12 items-center justify-center
              rounded-2xl
              text-2xl
              transition-all
              duration-300
              hover:bg-white/10
              hover:scale-110
            "
            title={app.name}
          >
            {app.icon}
          </button>
        ))}
      </div>
    </aside>
  );
}