"use client";

import { useEffect, useState } from "react";

import useLocation from "@/hooks/os/useLocation";
import AppGrid from "@/components/os/ui/AppGrid";
import { getWeather } from "@/services/weatherService";

import type { WeatherData } from "@/engines/environment";

import WeatherHero from "./WeatherHero";
import HourlyForecast from "./HourlyForecast";
import DailyForecast from "./DailyForecast";
import ConditionsGrid from "./ConditionsGrid";
import SunMoonCard from "./SunMoonCard";
import AirQualityCard from "./AirQualityCard";
import WeatherAlerts from "./WeatherAlerts";
import RadarCard from "./RadarCard";

import Skeleton from "@/components/os/ui/Skeleton";

export default function WeatherView() {
    const location = useLocation();

    const [weather, setWeather] =
        useState<WeatherData | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        if (!location) return;

        const { lat, lon } = location;

        async function loadWeather() {
            try {
                const data = await getWeather(lat, lon);

                setWeather(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        loadWeather();

        const interval = setInterval(
            loadWeather,
            15 * 60 * 1000
        );

        return () => clearInterval(interval);

    }, [location]);

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

    if (!weather) {
        return (
            <div className="text-center text-white/60">
                Unable to load weather.
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
                    <RadarCard />
                </div>

                {/* Full Width */}
                <div className="col-span-12">
                    <ConditionsGrid weather={weather} />
                </div>

                {/* Split */}
                <div className="col-span-12 lg:col-span-6">
                    <SunMoonCard />
                </div>

                <div className="col-span-12 lg:col-span-6">
                    <AirQualityCard />
                </div>

                {/* Full Width */}
                <div className="col-span-12">
                    <DailyForecast weather={weather} />
                </div>

                <div className="col-span-12">
                    <WeatherAlerts />
                </div>

            </AppGrid>

        </div>
    );
}