import { motion } from "framer-motion";
import clsx from "clsx";
import WidgetBackground from "./WidgetBackground";
import GlassPanel from "@/components/os/ui/GlassPanel";

import type {
  WidgetBaseProps,
  WidgetAccent,
} from "./types";

import {
  WIDGET_ACCENTS,
  WIDGET_TRANSITION,
} from "./constants";
interface Props extends WidgetBaseProps {
  hover?: boolean;
  accent?: WidgetAccent;
}

export default function Widget({
  children,
  className,
  hover = true,
  accent = "default",
}: Props) {
  return (
    <motion.div
      whileHover={
        hover
          ? {
              y: -4,
            }
          : undefined
      }
      transition={WIDGET_TRANSITION}
      className={clsx(
        "relative h-full",
        className
      )}
    >
      <GlassPanel
        hover={hover}
        className="
          relative
          h-full
          overflow-hidden

          rounded-[40px]

          p-7
        "
      >
       <WidgetBackground accent={accent} />

        <div
          className="
            relative
            z-10

            flex
            h-full
            flex-col
          "
        >
          {children}
        </div>
      </GlassPanel>
    </motion.div>
  );
}