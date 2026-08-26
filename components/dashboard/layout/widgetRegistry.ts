export interface WidgetRegistryItem {
  id: string;
  order: number;
  enabled: boolean;
}

export const WIDGET_REGISTRY: WidgetRegistryItem[] = [
  {
    id: "finance",
    order: 0,
    enabled: true,
  },
  {
    id: "clock",
    order: 1,
    enabled: true,
  },
  {
    id: "weather",
    order: 2,
    enabled: true,
  },
  {
    id: "calendar",
    order: 3,
    enabled: true,
  },
  {
    id: "notifications",
    order: 4,
    enabled: true,
  },
  {
    id: "cosmic",
    order: 5,
    enabled: true,
  },
  {
    id: "briefing",
    order: 6,
    enabled: true,
  },
  {
    id: "search",
    order: 7,
    enabled: true,
  },
  {
    id: "system",
    order: 8,
    enabled: true,
  },
  {
    id: "sports",
    order: 9,
    enabled: true,
  },
  {
    id: "garage",
    order: 10,
    enabled: true,
  },
  {
    id: "school",
    order: 11,
    enabled: true,
  },
  {
    id: "projects",
    order: 12,
    enabled: true,
  },
  {
    id: "notes",
    order: 13,
    enabled: true,
  },
  {
    id: "outlook",
    order: 14,
    enabled: true,
  },
  {
    id: "music",
    order: 15,
    enabled: true,
  },
];