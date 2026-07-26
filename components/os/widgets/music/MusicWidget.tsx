"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import MusicNowPlaying from "./MusicNowPlaying";
import MusicControls from "./MusicControls";
import MusicQueue from "./MusicQueue";
import MusicFooter from "./MusicFooter";

export default function MusicWidget() {
  return (
    <Widget
      accent="music"
    >
      <WidgetHeader
        title="Music"
        subtitle="Now Playing"
      />

      <WidgetBody>
        <MusicNowPlaying />

        <MusicControls />

        <MusicQueue />
      </WidgetBody>

      <WidgetFooter>
        <MusicFooter />
      </WidgetFooter>
    </Widget>
  );
}