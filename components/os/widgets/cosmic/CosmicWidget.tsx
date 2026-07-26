"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import CosmicGreeting from "./CosmicGreeting";
import CosmicBriefing from "./CosmicBriefing";
import CosmicActions from "./CosmicActions";
import CosmicFooter from "./CosmicFooter";

export default function CosmicWidget() {
  return (
    <Widget
      accent="cosmic"
    >
      <WidgetHeader
        title="Cosmic"
        subtitle="Your intelligent workspace"
      />

      <WidgetBody>
        <CosmicGreeting />

        <CosmicBriefing />

        <CosmicActions />
      </WidgetBody>

      <WidgetFooter>
        <CosmicFooter />
      </WidgetFooter>
    </Widget>
  );
}