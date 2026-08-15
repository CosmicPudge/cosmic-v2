import AmbientCalendar from "@/components/os/ambient/AmbientCalendar";
import AmbientClock from "@/components/os/ambient/AmbientClock";
import AmbientHeader from "@/components/os/ambient/AmbientHeader";
import AmbientMusic from "@/components/os/ambient/AmbientMusic";
import AmbientSection from "@/components/os/ambient/AmbientSection";
import AmbientShell from "@/components/os/ambient/AmbientShell";
import AmbientSports from "@/components/os/ambient/AmbientSports";
import AmbientWeather from "@/components/os/ambient/AmbientWeather";

export default function AmbientPage() {
  return (
    <AmbientShell>
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,25rem)] lg:gap-12">
        <div className="flex min-h-[55svh] flex-col justify-between gap-16">
          <AmbientHeader />
          <AmbientClock />
        </div>

        <aside className="grid content-end gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <AmbientSection title="Weather">
            <AmbientWeather />
          </AmbientSection>

          <AmbientSection title="Calendar">
            <AmbientCalendar />
          </AmbientSection>

          <AmbientSection title="Music">
            <AmbientMusic />
          </AmbientSection>

          <AmbientSection title="Followed sports">
            <AmbientSports />
          </AmbientSection>
        </aside>
      </div>
    </AmbientShell>
  );
}
