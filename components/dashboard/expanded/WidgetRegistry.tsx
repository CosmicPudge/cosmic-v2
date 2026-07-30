"use client";

import ExpandedWeather from "./widgets/ExpandedWeather";

const REGISTRY: Record<string, React.ComponentType> = {
  weather: ExpandedWeather,
};

interface WidgetRegistryProps {
  widgetId: string;
}

export default function WidgetRegistry({
  widgetId,
}: WidgetRegistryProps) {
  const Component = REGISTRY[widgetId];

  if (!Component) {
    return (
      <div className="flex h-full items-center justify-center text-white/60">
        No expanded view is registered for "{widgetId}".
      </div>
    );
  }

  return <Component />;
}