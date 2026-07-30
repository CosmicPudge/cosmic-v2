import { dashboardWidgets } from "@/config/widgets";

export interface WidgetRegistryItem {
  id: string;
  order: number;
  enabled: boolean;
}

export const WIDGET_REGISTRY: WidgetRegistryItem[] =
  dashboardWidgets.map((widget, index) => ({
    id: widget.id,
    order: index,
    enabled: true,
  }));