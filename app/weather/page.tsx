import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

import WeatherView from "@/components/apps/weather/WeatherView";
export default function WeatherPage() {
  return (
    <AppShell app="weather">

      <AppHeader
        title="Weather"
        subtitle="Current conditions and forecast"
      />

      <AppContent>

        <WeatherView />

      </AppContent>

    </AppShell>
  );
}