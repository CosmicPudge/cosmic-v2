"use client";

import { Maximize2 } from "lucide-react";
import { useExpandedWidget } from "@/components/dashboard/expanded";

interface WidgetToolbarProps {
  widgetId: string;
}

export default function WidgetToolbar({
  widgetId,
}: WidgetToolbarProps) {
  const { openWidget } = useExpandedWidget();

  return (
    <button
      onClick={() => openWidget(widgetId)}
      className="
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-2xl
        border
        border-white/10
        bg-white/5
        text-white/70
        transition-all
        cursor-pointer
        hover:border-white/20
        hover:bg-white/10
        hover:text-white
        active:scale-[0.98]
      "
      aria-label="Expand widget"
      title="Expand"
    >
      <Maximize2 size={18} />
    </button>
  );
}
