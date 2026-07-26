"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import SportsCurrent from "./SportsCurrent";
import SportsScores from "./SportsScores";
import SportsStandings from "./SportsStandings";
import SportsFooter from "./SportsFooter";

export default function SportsWidget() {
  return (
    <Widget
      accent="sports"
    >
      <WidgetHeader
        title="Sports"
        subtitle="Live scores & favorite teams"
      />

      <WidgetBody>
        <SportsCurrent />

        <SportsScores />

        <SportsStandings />
      </WidgetBody>

      <WidgetFooter>
        <SportsFooter />
      </WidgetFooter>
    </Widget>
  );
}