"use client";

import { motion } from "framer-motion";

import type { DashboardWidget } from "@/config/widgets";
interface Props {
  widget: DashboardWidget;
}

export default function GridItem({
  widget,
}: Props) {
  const Widget = widget.component;

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
        gridColumn: `span ${widget.cols}`,
        gridRow: `span ${widget.rows}`,
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