"use client";

import { dashboardWidgets } from "@/config/widgets";

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {dashboardWidgets.map((widget) => {
        const Widget = widget.component;

        return (
          <div
            key={widget.id}
            className={widget.span}
          >
            <Widget />
          </div>
        );
      })}
    </div>
  );
}