"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";
import Link from "next/link";

export default function CosmicWidget() {
  return (
    <Widget
      accent="cosmic"
    >
      <WidgetHeader
        title="Cosmic"
        subtitle="Your intelligent workspace"
      />

      <WidgetBody><WidgetEmpty title="Cosmic AI is ready" description="Open Cosmic AI to ask a real question or provide a source." /></WidgetBody>

      <WidgetFooter><Link href="/ai" className="text-xs text-cyan-100">Open Cosmic AI</Link></WidgetFooter>
    </Widget>
  );
}
