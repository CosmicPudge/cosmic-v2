"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";

export default function NotificationsWidget() {
  return (
    <Widget
      accent="notifications"
    >
      <WidgetHeader
        title="Notifications"
        subtitle="Notification Center"
      />

      <WidgetBody><WidgetEmpty title="No notification feed connected" description="Open Notifications to review available alerts." compact /></WidgetBody>

      <WidgetFooter><span className="text-xs text-rose-100/70">Notification source unavailable</span></WidgetFooter>
    </Widget>
  );
}
