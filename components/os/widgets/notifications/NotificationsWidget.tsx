"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import NotificationsPreview from "./NotificationsPreview";
import NotificationsList from "./NotificationsList";
import NotificationsHistory from "./NotificationsHistory";
import NotificationsFooter from "./NotificationsFooter";

export default function NotificationsWidget() {
  return (
    <Widget
      accent="notifications"
    >
      <WidgetHeader
        title="Notifications"
        subtitle="Notification Center"
      />

      <WidgetBody>
        <NotificationsPreview />

        <NotificationsList />

        <NotificationsHistory />
      </WidgetBody>

      <WidgetFooter>
        <NotificationsFooter />
      </WidgetFooter>
    </Widget>
  );
}