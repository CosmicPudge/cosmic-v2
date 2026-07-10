"use client";

import useWeather from "@/hooks/os/useWeather";
import AppGrid from "@/components/os/ui/AppGrid";
import WeatherRadar from "./radar/WeatherRadar";
import MoonCard from "./MoonCard";
import WeatherHero from "./WeatherHero";
import HourlyForecast from "./HourlyForecast";
import DailyForecast from "./DailyForecast";
import ConditionsGrid from "./ConditionsGrid";
import SunMoonCard from "./SunMoonCard";
import AirQualityCard from "./AirQualityCard";
import WeatherAlerts from "./WeatherAlerts";

import Skeleton from "@/components/os/ui/Skeleton";

export default function WeatherView() {
    const {
    weather,
    loading,
    error,
} = useWeather();

    if (loading) {
        return (
            <div className="space-y-6">

                <Skeleton className="h-80" />

                <Skeleton className="h-40" />

                <Skeleton className="h-56" />

                <Skeleton className="h-48" />

            </div>
        );
    }

   if (error) {
    return (
        <div className="text-center text-red-400">
            {error}
        </div>
    );
}

if (!weather) {
    return (
        <div className="text-center text-white/60">
            Weather unavailable.
        </div>
    );
}

    return (
        <div className="space-y-10">

            <WeatherHero weather={weather} />

            <AppGrid>

                {/* Left Column */}
                <div className="col-span-12 lg:col-span-6">
                    <HourlyForecast weather={weather} />
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-6">
                    <WeatherRadar
                        lat={weather.lat}
                        lon={weather.lon}
                    />
                </div>

                {/* Full Width */}
                <div className="col-span-12">
                    <ConditionsGrid weather={weather} />
                </div>

                {/* Split */}
                <div className="col-span-12 lg:col-span-4">
                    <SunMoonCard weather={weather} />
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <MoonCard weather={weather} />
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <AirQualityCard weather={weather} />
                </div>

                {/* Full Width */}
                <div className="col-span-12">
                    <DailyForecast weather={weather} />
                </div>

                <div className="col-span-12">
                    <WeatherAlerts weather={weather} />
                </div>

            </AppGrid>

        </div>
    );
}