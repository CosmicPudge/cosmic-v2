"use client";

export default function WidgetLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
        <span className="text-sm text-white/60">
          Loading...
        </span>
      </div>
    </div>
  );
}