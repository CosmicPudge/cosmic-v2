"use client";

import type { DashboardWidget } from "@/config/widgets";

interface KioskSlideProps {
  widget: DashboardWidget;
  active: boolean;
  exiting: boolean;
}

export default function KioskSlide({
  widget,
  active,
  exiting,
}: KioskSlideProps) {
  const WidgetComponent = widget.component;
function formatWidgetTitle(id: string) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
  return (
    <section
      className={[
        "absolute inset-0",
        "flex items-center justify-center",
        "kiosk-slide p-[clamp(.45rem,2.4vw,2.5rem)]",
        "transition-[transform,opacity]",
        "ease-[cubic-bezier(.22,.61,.36,1)]",
        active && !exiting
          ? "translate-x-0 opacity-100"
          : exiting
            ? "-translate-x-full opacity-0"
            : "translate-x-full opacity-0",
      ].join(" ")}
      style={{ transitionDuration: "700ms" }}
      aria-hidden={!active}
    >
      <div className="kiosk-slide-card relative flex h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-[clamp(1.5rem,3vw,2.75rem)] border border-white/10 bg-black/10 shadow-[0_30px_120px_rgba(0,0,0,.3)] backdrop-blur-md">

        {/* Header */}
        <header className="kiosk-slide-header flex shrink-0 items-center justify-between border-b border-white/[0.07] px-[clamp(1.25rem,3vw,2.5rem)] py-[clamp(.9rem,2vh,1.4rem)]">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300/80 shadow-[0_0_16px_rgba(103,232,249,.7)]" />

            <div className="min-w-0">
              <p className="text-[clamp(.65rem,1vw,.8rem)] font-semibold uppercase tracking-[0.24em] text-white/35">
                Cosmic
              </p>

              <h1 className="truncate text-[clamp(1.15rem,2vw,1.7rem)] font-semibold tracking-tight text-white/90">
                {formatWidgetTitle(widget.id)}
              </h1>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[clamp(.65rem,1vw,.8rem)] font-medium uppercase tracking-[0.2em] text-white/25">
              Kiosk
            </p>
          </div>
        </header>

        {/* Widget presentation area */}
        <div className="kiosk-slide-content relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-[clamp(1rem,3vw,2.75rem)]">
          <div className="flex h-full max-h-full w-full items-center justify-center">
            <div className="w-full">
              <WidgetComponent />
            </div>
          </div>
        </div>

        {/* Subtle presentation edge */}
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.035]" />
      </div>
    </section>
  );
}
