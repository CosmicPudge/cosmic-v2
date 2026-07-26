"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import GarageStatus from "./GarageStatus";
import GarageMaintenance from "./GarageMaintenance";
import GarageFuel from "./GarageFuel";
import GarageFooter from "./GarageFooter";

export default function GarageWidget() {
  return (
    <Widget
      accent="garage"
    >
      <WidgetHeader
        title="Garage"
        subtitle="Vehicle Dashboard"
      />

      <WidgetBody>
        <GarageStatus />

        <GarageMaintenance />

        <GarageFuel />
      </WidgetBody>

      <WidgetFooter>
        <GarageFooter />
      </WidgetFooter>
    </Widget>
  );
}