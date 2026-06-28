"use client";

"use client";

import { ReactNode } from "react";

import GlassPanel from "@/components/os/ui/GlassPanel";
import { useOS } from "@/components/os/core/OSProvider";
import useWindow from "@/hooks/os/useWindow";

type WindowName = "weather";

interface AppWindowProps {
    title: string;
    windowName: WindowName;
    children: ReactNode;
}

export default function AppWindow({
    title,
    windowName,
    children,
}: AppWindowProps) {
    const { closeWindow } = useOS();

    const window = useWindow();

    return (
        <div
            className="absolute z-40 w-[700px] max-w-[90vw]"
            style={{
                left: window.position.x,
                top: window.position.y,
            }}
        >
            <GlassPanel className="overflow-hidden p-0">
                <div
                    onMouseDown={window.onMouseDown}
                    className="window-titlebar flex cursor-move items-center justify-between border-b border-white/10 px-5 py-3 select-none"
                >
                    <h2 className="font-semibold">
                        {title}
                    </h2>

                    <button
                        onClick={() => closeWindow(windowName)}
                        className="rounded-lg px-2 py-1 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    {children}
                </div>
            </GlassPanel>
        </div>
    );
}