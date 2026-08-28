"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { CosmicIcon } from "@/components/cosmic-icons";
import { useNotifications } from "@/hooks/os/useNotifications";
import type { CosmicNotification } from "@/core/contracts/Notifications";

export default function NotificationsWidget() {
  const { presentation } = useWidgetContext();
  const notificationState = useNotifications();
  if (presentation === "kiosk") return <KioskNotificationsScene notifications={notificationState.notifications} loading={notificationState.loading} />;

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

function KioskNotificationsScene({ notifications, loading }: { notifications: CosmicNotification[]; loading: boolean }) {
  const primary = notifications[0];
  const secondary = notifications.slice(1, 3);
  return (
    <Widget accent="notifications" className="kiosk-notifications-widget" contentPadding={false} hover={false} imageOpacity={0} imageBlur={0}>
      <div className="kiosk-notifications-scene">
        <div className="kiosk-notifications-atmosphere" aria-hidden="true" />
        <div className="kiosk-notifications-orbit" aria-hidden="true" />
        <div className="kiosk-notifications-content">
          <div className="kiosk-notifications-heading">
            <span className="kiosk-notifications-live-dot" aria-hidden="true" />
            <span>COSMIC</span>
            <span aria-hidden="true">•</span>
            <span>NOTIFICATIONS</span>
          </div>

          {primary ? <div className="kiosk-notifications-feed" role="status" aria-live="polite">
            <article className="kiosk-notifications-primary">
              <div className="kiosk-notifications-item-meta"><span>{primary.source.toUpperCase()}</span><span>{formatNotificationTime(primary.timestamp)}</span></div>
              <h1>{primary.title}</h1>
              {primary.body && <p>{primary.body}</p>}
            </article>
            {secondary.length > 0 && <div className="kiosk-notifications-secondary">{secondary.map((notification) => <article key={notification.id}>
              <div className="kiosk-notifications-item-meta"><span>{notification.source.toUpperCase()}</span><span>{formatNotificationTime(notification.timestamp)}</span></div>
              <h2>{notification.title}</h2>
              {notification.body && <p>{notification.body}</p>}
            </article>)}</div>}
          </div> : <div className="kiosk-notifications-empty" role="status" aria-live="polite">
            <div className="kiosk-notifications-icon"><CosmicIcon icon="notifications" size={76} glow="purple" label="Notifications" /></div>
            <p className="kiosk-notifications-eyebrow">{loading ? "LOADING NOTIFICATIONS" : "NO NEW NOTIFICATIONS"}</p>
            <h1>{loading ? "Checking in." : "All clear."}</h1>
            <p className="kiosk-notifications-description">{loading ? "Cosmic is checking your notification channels." : "Cosmic will surface important updates here when they arrive."}</p>
          </div>}

          <div className="kiosk-notifications-footer">QUIET CHANNEL <span aria-hidden="true">•</span> READY FOR UPDATES</div>
        </div>
      </div>
    </Widget>
  );
}

function formatNotificationTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
