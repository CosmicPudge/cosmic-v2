"use client";

import type { DashboardWidget } from "@/config/widgets";
import type { ComponentType } from "react";
import { WidgetProvider } from "@/components/os/ui/widget/WidgetContext";
import KioskWidgetErrorBoundary from "./KioskWidgetErrorBoundary";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const testCrash = process.env.NODE_ENV !== "production" && searchParams.get("cosmic-test-crash") === "widget";
  return (
    <section
      className={[
        "absolute inset-0",
        "kiosk-slide",
        widget.id === "clock" ? "kiosk-slide-clock" : "",
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
      data-kiosk-scene={widget.id}
    >
      <div className="kiosk-slide-card relative flex h-full w-full flex-col overflow-hidden">
        <div className="kiosk-slide-content relative flex min-h-0 flex-1 items-stretch justify-stretch overflow-hidden">
          <div className="flex h-full min-h-0 w-full items-stretch">
            <div className="h-full min-h-0 w-full">
              <WidgetProvider size="medium" presentation="kiosk" active={active && !exiting}>
                <KioskWidgetErrorBoundary widgetId={widget.id}><KioskWidgetContent WidgetComponent={WidgetComponent} testCrash={testCrash} /></KioskWidgetErrorBoundary>
              </WidgetProvider>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KioskWidgetContent({ WidgetComponent, testCrash }: { WidgetComponent: ComponentType; testCrash: boolean }) {
  if (testCrash) throw new Error("Development kiosk widget crash test");
  return <WidgetComponent />;
}
