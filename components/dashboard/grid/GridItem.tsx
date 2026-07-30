"use client";

import { motion } from "framer-motion";

import { AppRenderer, getApp } from "@/apps/core";

import { useDisplay } from "@/components/os/display";

import type { DashboardWidget } from "@/config/widgets";
import type { WidgetFootprint } from "@/apps/core";

interface Props {
  widget: DashboardWidget;
}

export default function GridItem({
  widget,
}: Props) {
  const { profile } = useDisplay();

  let cols = widget.cols;
  const rows = widget.rows;

  switch (profile) {
    case "pocket":
      cols = 1;
      break;

    case "compact":
      cols = Math.min(widget.cols, 3);
      break;

    case "comfortable":
    case "expanded":
      cols = widget.cols;
      break;
  }

  cols = Math.min(cols, 4) as 1 | 2 | 3 | 4;

  const footprint: WidgetFootprint = {
    cols: cols as WidgetFootprint["cols"],
    rows: rows as WidgetFootprint["rows"],
  };

  const app =
    widget.appId != null
      ? getApp(widget.appId)
      : undefined;

  const content =
    app != null ? (
      <AppRenderer
        app={app}
        presentation="widget"
        footprint={footprint}
      />
    ) : (
      (() => {
        const Widget = widget.component;
        return <Widget />;
      })()
    );

  return (
    <motion.div
      layout
      layoutId={widget.id}
      initial={{
        opacity: 0,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      whileHover={{
        y: -2,
      }}
      transition={{
        duration: 0.25,
      }}
      style={{
        gridColumn: `span ${cols}`,
        gridRow: `span ${rows}`,
        minWidth: 0,
      }}
      data-widget-id={widget.id}
      data-resizable={widget.resizable}
      data-movable={widget.movable}
    >
      {content}
    </motion.div>
  );
}
