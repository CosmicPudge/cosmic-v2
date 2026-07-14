"use client";

import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export default function AmbientCard({
    children,
}: Props) {
    return (
        <div
            className="
        w-full
        max-w-7xl
        min-h-[520px]

        rounded-3xl
border border-white/10

bg-white/[0.06]

backdrop-blur-2xl

shadow-[0_0_30px_rgba(255,255,255,0.03)]

        p-10
      "
        >
            {children}
        </div>
    );
}