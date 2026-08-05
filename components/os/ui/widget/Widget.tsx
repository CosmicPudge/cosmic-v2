"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

import { useDisplay } from "@/components/os/display";

import GlassPanel from "@/components/os/ui/GlassPanel";
import WidgetBackground from "./WidgetBackground";

import type {
  WidgetAccent,
  WidgetBaseProps,
} from "./types";

import { WIDGET_TRANSITION } from "./constants";

interface Props extends WidgetBaseProps {
  hover?: boolean;
  accent?: WidgetAccent;

  /**
   * Controls whether the widget content receives
   * the standard Cosmic padding.
   *
   * Backgrounds always fill the entire widget.
   */
  contentPadding?: boolean;
}

export default function Widget({
  children,
  className,
  hover = true,
  accent = "default",
  contentPadding = true,
}: Props) {
  const { tokens } = useDisplay();

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
        "relative h-full min-h-0",
        className
      )}
    >
      <GlassPanel
        hover={hover}
        className="
          relative
          h-full
          min-h-0
          overflow-hidden
        "
        style={{
          borderRadius: tokens.radius.xl,
          backdropFilter: `blur(${tokens.blur}px)`,
        }}
      >
        {/* Full widget background */}
        <WidgetBackground accent={accent} />

        {/* Widget content */}
        <div
          className="
            relative
            z-10

            flex
            h-full
            min-h-0
            flex-col
          "
          style={{
            padding: contentPadding ? tokens.spacing.lg : 0,
          }}
        >
          {children}
        </div>
      </GlassPanel>
    </motion.div>
  );
}