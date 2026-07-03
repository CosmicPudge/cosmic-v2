"use client";

import WeatherIcon from "@/components/os/ui/WeatherIcon";
import type { WeatherData } from "@/engines/environment";
import { formatTime } from "@/utils/os/formatTime";
import getGreeting from "./getGreeting";


interface Props {
    weather: WeatherData;
}

export default function WeatherHero({
    weather,
}: Props) {

    const greeting =
        getGreeting(weather);

    return (
        <section className="mb-12">

            <div className="flex flex-col items-center text-center">

                <p className="text-lg uppercase tracking-[0.3em] text-white/60">
                    {greeting}
                </p>

                <WeatherIcon
                    icon={weather.icon}
                    className="my-8 h-24 w-24"
                />

                <h1 className="text-9xl font-black tracking-tight">
                    {weather.temp}°
                </h1>

                <h2 className="mt-5 text-4xl font-light">
                    {weather.description}
                </h2>

                <p className="mt-4 text-xl text-white/60">
                    {weather.city}, UT
                </p>

                <p className="mt-6 text-lg text-white/45">

                    H {weather.high}°

                    •

                    L {weather.low}°

                    •

                    Feels Like {weather.feelsLike}°

                </p>

                <p className="mt-3 text-sm text-white/40">
                    Updated {formatTime(weather.lastUpdated)}
                </p>

            </div>

        </section>
    );
}