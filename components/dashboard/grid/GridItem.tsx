"use client";

import { motion } from "framer-motion";

import { useDisplay } from "@/components/os/display";

import type { DashboardWidget } from "@/config/widgets";

interface Props {
  widget: DashboardWidget;
}

export default function GridItem({
  widget,
}: Props) {
  const { profile } = useDisplay();

  const Widget = widget.component;

  let cols = widget.cols;
  let rows = widget.rows;

  switch (profile) {
    case "pocket":
      cols = 1;
      break;

    case "compact":
      cols = Math.min(widget.cols, 3);
      break;

    case "comfortable":
      cols = widget.cols;
      break;

    case "expanded":
      cols = widget.cols;
      break;
  }

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
      <Widget />
    </motion.div>
  );
}