/**
 * Cosmic v2
 * School Notifications
 *
 * Shared notification types used throughout the School dashboard.
 */

export type NotificationType =
  | "critical"
  | "warning"
  | "success"
  | "info"
  | "reminder"
  | "insight";

export type NotificationPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export type NotificationSource =
  | "canvas"
  | "calendar"
  | "cosmic"
  | "system"
  | "manual";

export interface NotificationAction {
  id: string;

  label: string;

  icon?: string;

  href?: string;

  onClick?: () => void;
}

export interface SchoolNotification {
  /**
   * Unique notification id.
   */
  id: string;

  /**
   * Short title shown in bold.
   */
  title: string;

  /**
   * Supporting message.
   */
  message: string;

  /**
   * Visual notification style.
   */
  type: NotificationType;

  /**
   * Determines ordering.
   */
  priority: NotificationPriority;

  /**
   * Origin of the notification.
   */
  source: NotificationSource;

  /**
   * Human readable timestamp.
   *
   * Examples:
   * "5 min ago"
   * "Today"
   * "Tomorrow"
   * "Yesterday"
   */
  timestamp: string;

  /**
   * Has the notification been read?
   */
  read: boolean;

  /**
   * Can the user dismiss it?
   */
  dismissible?: boolean;

  /**
   * Optional quick action.
   */
  action?: NotificationAction;

  /**
   * Whether Cosmic AI generated this notification.
   */
  aiGenerated?: boolean;

  /**
   * Optional expiration.
   */
  expiresAt?: Date;

  /**
   * Optional metadata for future integrations.
   */
  metadata?: Record<string, unknown>;
}