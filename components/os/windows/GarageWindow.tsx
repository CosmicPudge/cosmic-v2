"use client";

import AppWindow from "./AppWindow";
import StatCard from "../ui/StatCard";
import SectionCard from "../ui/SectionCard";

export default function GarageWindow() {
    return (
        <AppWindow
            title="Garage"
            windowName="garage"
        >
            <div className="space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">
                        My Vehicle
                    </h1>

                    <p className="text-white/60">
                        Vehicle information and maintenance overview.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">

                    <StatCard
                        title="Mileage"
                        value="-- mi"
                    />

                    <StatCard
                        title="Fuel Level"
                        value="--%"
                    />

                    <StatCard
                        title="Oil Change"
                        value="Unknown"
                    />

                    <StatCard
                        title="Maintenance"
                        value="No Alerts"
                    />

                </div>

                <SectionCard title="Recent Activity">
  <p className="text-white/60">
    Garage history will appear here.
  </p>
</SectionCard>

            </div>
        </AppWindow>
    );
}