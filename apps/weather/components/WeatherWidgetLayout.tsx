"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WeatherCurrent from "@/components/os/widgets/weather/WeatherCurrent";
import WeatherFooter from "@/components/os/widgets/weather/WeatherFooter";
import WeatherHourly from "@/components/os/widgets/weather/WeatherHourly";
import WeatherStats from "@/components/os/widgets/weather/WeatherStats";

import type { WidgetSize } from "@/apps/core";

import { useWeatherContext } from "../context";
import { WeatherScene } from "./scene";

interface Props { layout: WidgetSize; }

type Density = "dense" | "comfortable" | "luxury";
type LayoutSpec = {
  frame: string;
  body: string;
  current: string;
  metrics: string;
  forecast: string;
  currentDensity: Density;
  metricsDensity: Density;
  forecastDensity: Density;
  header: string;
};

// Each footprint has an intentional composition. The shared data components
// guarantee information parity; only balance, hierarchy, and placement vary.
const layouts: Record<WidgetSize, LayoutSpec> = {
  "1x1": { frame: "gap-1 p-1", body: "contents", current: "", metrics: "", forecast: "", currentDensity: "dense", metricsDensity: "dense", forecastDensity: "dense", header: "text-[8px]" },
  "2x1": { frame: "gap-1.5 p-1", body: "grid min-h-0 flex-1 grid-cols-[0.85fr_1.15fr] gap-2", current: "flex items-center", metrics: "flex items-center", forecast: "", currentDensity: "dense", metricsDensity: "dense", forecastDensity: "dense", header: "text-[9px]" },
  "3x1": { frame: "gap-1.5 p-2", body: "grid min-h-0 flex-1 grid-cols-[0.8fr_1fr_1.2fr] items-center gap-3", current: "", metrics: "", forecast: "", currentDensity: "dense", metricsDensity: "dense", forecastDensity: "dense", header: "text-[10px]" },
  "4x1": { frame: "gap-2 p-2", body: "grid min-h-0 flex-1 grid-cols-[0.9fr_1fr_1.45fr] items-center gap-5", current: "", metrics: "", forecast: "", currentDensity: "comfortable", metricsDensity: "dense", forecastDensity: "dense", header: "text-[10px]" },
  "1x2": { frame: "gap-4 p-3", body: "grid min-h-0 flex-1 grid-rows-[auto_auto_1fr] content-between", current: "", metrics: "", forecast: "", currentDensity: "dense", metricsDensity: "dense", forecastDensity: "dense", header: "text-[10px]" },
  "2x2": { frame: "gap-2 p-2", body: "grid min-h-0 flex-1 grid-cols-[1.05fr_0.95fr] grid-rows-[auto_1fr] gap-x-5 gap-y-3", current: "flex items-center", metrics: "flex items-center", forecast: "col-span-2", currentDensity: "comfortable", metricsDensity: "comfortable", forecastDensity: "dense", header: "text-sm" },
  "3x2": { frame: "gap-5 p-5", body: "grid min-h-0 flex-1 grid-cols-[1.1fr_0.9fr] grid-rows-[auto_1fr] gap-x-8 gap-y-5", current: "flex items-center", metrics: "flex items-center", forecast: "col-span-2", currentDensity: "luxury", metricsDensity: "comfortable", forecastDensity: "comfortable", header: "text-base" },
  "4x2": { frame: "gap-4 p-4", body: "grid min-h-0 flex-1 grid-cols-[1.1fr_0.9fr] grid-rows-[auto_1fr] gap-x-10 gap-y-4", current: "flex items-center", metrics: "flex items-center", forecast: "col-span-2", currentDensity: "luxury", metricsDensity: "comfortable", forecastDensity: "luxury", header: "text-lg" },
};

export default function WeatherWidgetLayout({ layout }: Props) {
  const { weather, loading, error } = useWeatherContext();
  const spec = layouts[layout];

  return <Widget
  accent="weather"
  hover={layout !== "1x1"}
  contentPadding={false}
><WeatherScene><div className={`flex h-full min-h-0 flex-col ${spec.frame}`}><header className={`flex items-center justify-between ${spec.header}`}><div className="min-w-0"><p className="text-[8px] uppercase tracking-[0.2em] text-white/55">Weather</p><p className="truncate font-medium text-white">{weather?.city ?? "Current location"}</p></div><span className="text-[8px] text-white/55">Live</span></header><div className={spec.body}><section className={spec.current} aria-label="Current conditions"><WeatherCurrent weather={weather} loading={loading} density={spec.currentDensity} /></section><section className={spec.metrics} aria-label="Weather metrics"><WeatherStats weather={weather} loading={loading} density={spec.metricsDensity} /></section><section className={spec.forecast} aria-label="Hourly forecast"><WeatherHourly weather={weather} loading={loading} density={spec.forecastDensity} /></section></div><footer className="border-t border-white/10 pt-1.5"><WeatherFooter weather={weather} error={error} dense={spec.currentDensity === "dense" && spec.metricsDensity === "dense"} /></footer></div></WeatherScene></Widget>;
}
