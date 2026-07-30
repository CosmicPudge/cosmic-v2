"use client";

import GlassPanel from "@/components/os/ui/GlassPanel";
import { useExpandedWidget } from "./ExpandedWidgetProvider";
import WidgetRegistry from "./WidgetRegistry";

export default function ExpandedWidgetOverlay() {
    const { expandedWidget, closeWidget } = useExpandedWidget();

    if (!expandedWidget) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            {/* Backdrop */}
            <button
                aria-label="Close expanded widget"
                onClick={closeWidget}
                className="
          absolute
          inset-0
          bg-black/40
          backdrop-blur-xl
        "
            />

            {/* Window */}
            <GlassPanel
                variant="hero"
                className="
          relative
          z-10
          flex
          h-[80vh]
          w-[min(1200px,90vw)]
          flex-col
          overflow-hidden
        "
            >
                <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">
                    <h2 className="text-xl font-semibold text-white capitalize">
                        {expandedWidget}
                    </h2>

                    <button
                        onClick={closeWidget}
                        className="
              rounded-full
              px-3
              py-2
              text-white/70
              transition
              hover:bg-white/10
              hover:text-white
            "
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-hidden p-8">
                    <WidgetRegistry widgetId={expandedWidget} />
                </div>
            </GlassPanel>
        </div>
    );
}