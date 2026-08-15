import type {
  CalendarEventCategory,
  CalendarEventPriority,
} from "@/core/contracts";

export interface CalendarSubscription {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  priority: CalendarEventPriority;
  category?: CalendarEventCategory;
}
