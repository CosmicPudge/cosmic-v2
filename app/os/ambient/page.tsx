"use client";

import { useEffect } from "react";

import { BootProvider } from "@/components/os/boot/BootManager";
import { CosmicBoot } from "@/components/os/boot";

import AmbientShell from "@/components/os/ambient/AmbientShell";
import AmbientCard from "@/components/os/ambient/AmbientCard";
import AmbientHeader from "@/components/os/ambient/AmbientHeader";
import AmbientClock from "@/components/os/ambient/AmbientClock";
import AmbientWeather from "@/components/os/ambient/AmbientWeather";
import AmbientCalendar from "@/components/os/ambient/AmbientCalendar";
import AmbientLeave from "@/components/os/ambient/AmbientLeave";
import AmbientSports from "@/components/os/ambient/AmbientSports";
import AmbientGreeting from "@/components/os/ambient/AmbientGreeting";
import AmbientSection from "@/components/os/ambient/AmbientSection";
export default function AmbientPage() {
  useEffect(() => {
    const refreshed = sessionStorage.getItem("ambient-refresh");

    if (!refreshed) {
      sessionStorage.setItem("ambient-refresh", "true");

      const timer = setTimeout(() => {
        window.location.reload();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
        <AmbientShell>
          <AmbientCard>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12">
                <AmbientHeader />
              </div>

              <div className="col-span-7">
                <AmbientClock />
              </div>

              <div className="col-span-5">
                <AmbientWeather />
              </div>

              <div className="col-span-6">
                <AmbientSection title="Next Event">
                  <AmbientCalendar />
                </AmbientSection>
              </div>

              <div className="col-span-6">
                <AmbientSection title="Leave In">
                  <AmbientLeave />
                </AmbientSection>
              </div>

              <div className="col-span-6">
                <AmbientSection title="Sports">
                  <AmbientSports />
                </AmbientSection>
              </div>

              <div className="col-span-6">
                <AmbientSection title="Today">
                  <AmbientGreeting />
                </AmbientSection>
              </div>
            </div>
          </AmbientCard>
        </AmbientShell>
  );
}