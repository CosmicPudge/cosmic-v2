"use client";

import Link from "next/link";
import { CloudSun, Search } from "lucide-react";
import { useEffect, useState } from "react";

import WeatherIcon from "@/components/os/ui/WeatherIcon";
import { useSearchRuntime } from "@/components/apps/search/SearchProvider";
import useWeather from "@/hooks/os/useWeather";

function TopBarClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="cosmos-reference-clock" aria-label="Current date and time">
      <span className="cosmos-reference-date">
        {now ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(now) : "—"}
      </span>
      <time className="cosmos-reference-time" suppressHydrationWarning dateTime={now?.toISOString()}>
        {now ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(now) : "--:--"}
      </time>
    </div>
  );
}

export default function CosmosTopBar() {
  const { openSearch } = useSearchRuntime();
  const { weather, loading: weatherLoading, error: weatherError } = useWeather();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const visibleWeather = mounted ? weather : null;
  const visibleLoading = mounted ? weatherLoading : true;
  const visibleError = mounted ? weatherError : null;

  return (
    <header className="cosmos-topbar cosmos-reference-topbar" aria-label="Cosmos toolbar">
      <button
        type="button"
        className="cosmos-search-trigger cosmos-reference-search"
        onClick={() => openSearch()}
        aria-label="Search across Cosmos"
      >
        <Search size={19} strokeWidth={1.9} aria-hidden="true" />
        <span className="truncate">Search across Cosmos...</span>
        <kbd className="cosmos-reference-shortcut" aria-hidden="true">⌘K</kbd>
      </button>
      <div className="cosmos-reference-topbar-right">
        <TopBarClock />
        <span className="cosmos-reference-weather-divider" aria-hidden="true" />
        <Link href="/weather" className="cosmos-reference-weather" title={visibleError ? "Weather temporarily unavailable" : "Open weather"} aria-label={visibleWeather ? `Weather in ${visibleWeather.city}: ${visibleWeather.temp} degrees` : "Open weather"}>
          <span className="cosmos-reference-weather-icon">
            {visibleWeather ? <WeatherIcon icon={visibleWeather.icon} className="!text-[2rem] leading-none" /> : <CloudSun size={30} />}
          </span>
          <span className="cosmos-reference-weather-info">
            <span className="cosmos-reference-temperature">{visibleLoading && !visibleWeather ? "—°" : visibleWeather ? `${Math.round(visibleWeather.temp)}°` : "—°"}</span>
            <span className="cosmos-reference-weather-location">{visibleWeather?.condition ? visibleWeather.condition : visibleLoading ? "Loading weather" : visibleError ? "Weather unavailable" : "Location unavailable"}
            {visibleWeather?.city && <span className="cosmos-reference-weather-city">{visibleWeather.city}</span>}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
