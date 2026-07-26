"use client";

import { dashboardWidgets } from "@/config/widgets";

const CELL_HEIGHT = 170;

export default function DashboardGrid() {
  const widgets = [...dashboardWidgets].sort(
    (a, b) => a.priority - b.priority
  );

  return (
    <div
      className="grid grid-cols-12 gap-5 w-full"
      style={{
        gridAutoRows: `${CELL_HEIGHT}px`,
      }}
    >
      {widgets.map((widget) => {
        const Widget = widget.component;

        return (
          <div
            key={widget.id}
            className="min-w-0"
            style={{
              gridColumn: `span ${widget.cols}`,
              gridRow: `span ${widget.rows}`,
            }}
          >
            <Widget />
          </div>
        );
      })}
    </div>
  );
}