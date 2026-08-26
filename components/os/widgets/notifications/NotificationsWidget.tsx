"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";

export default function NotificationsWidget() {
  const { presentation } = useWidgetContext();
  return (
    <Widget
      accent="notifications"
    >
      <WidgetHeader
        title="Notifications"
        subtitle="Notification Center"
      />

      <WidgetBody><WidgetEmpty title={presentation === "kiosk" ? "No new notifications" : "No notification feed connected"} description="Open Notifications to review available alerts." compact /></WidgetBody>

      <WidgetFooter><span className="text-xs text-rose-100/70">{presentation === "kiosk" ? "Nothing new" : "Notification source unavailable"}</span></WidgetFooter>
    </Widget>
  );
}
