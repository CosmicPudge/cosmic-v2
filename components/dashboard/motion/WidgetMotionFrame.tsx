"use client";

import { motion } from "framer-motion";

interface WidgetMotionFrameProps {
  layoutId: string;
  children: React.ReactNode;
}

export default function WidgetMotionFrame({
  layoutId,
  children,
}: WidgetMotionFrameProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}