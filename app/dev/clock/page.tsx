import ClockWidget from "@/components/os/widgets/clock/ClockWidget";
import { WidgetProvider } from "@/components/os/ui/widget/WidgetContext";
import type { WidgetSize } from "@/components/os/ui/widget";

const previews: Array<{ size: WidgetSize; className: string }> = [
  { size: "small", className: "h-56 max-w-sm" },
  { size: "medium", className: "h-80 max-w-xl" },
  { size: "large", className: "h-96 max-w-3xl" },
];

export default function ClockWidgetLab() {
  return (
    <main className="min-h-screen bg-black/15 px-5 py-10 text-white sm:px-10">
      <header className="mx-auto mb-9 max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/45">Development preview</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Clock widget sizes</h1>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8">
        {previews.map((preview) => (
          <section key={preview.size} aria-labelledby={`clock-${preview.size}`}>
            <h2 id={`clock-${preview.size}`} className="mb-3 text-sm font-medium capitalize text-white/55">{preview.size}</h2>
            <div className={preview.className}>
              <WidgetProvider size={preview.size}>
                <ClockWidget />
              </WidgetProvider>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
