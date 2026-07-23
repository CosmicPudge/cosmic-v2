"use client";

import { motion } from "framer-motion";

import NotificationEmpty from "./NotificationEmpty";
import NotificationHeader from "./NotificationHeader";
import NotificationItem from "./NotificationItem";
import {
  sortNotifications,
} from "./notificationHelpers";
import {
  SchoolNotification,
} from "./notificationTypes";

interface NotificationsCardProps {
  notifications: SchoolNotification[];
}

export default function NotificationsCard({
  notifications,
}: NotificationsCardProps) {
  const sortedNotifications =
    sortNotifications(notifications);

  const unreadCount =
    notifications.filter(
      (notification) => !notification.read
    ).length;

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
      }}
      className="
        relative
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.045]
        p-7
        backdrop-blur-2xl
      "
    >
      {/* Ambient Glow */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-sky-500/10
          via-transparent
          to-transparent
          pointer-events-none
        "
      />

      <div className="relative z-10">

        <NotificationHeader
          notificationCount={unreadCount}
        />

        <div className="mt-8">

          {sortedNotifications.length === 0 ? (
            <NotificationEmpty />
          ) : (
            <div className="space-y-4">

              {sortedNotifications.map(
                (
                  notification,
                  index
                ) => (
                  <NotificationItem
                    key={notification.id}
                    notification={
                      notification
                    }
                    index={index}
                  />
                )
              )}

            </div>
          )}

        </div>

      </div>

    </motion.section>
  );
}