"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { CSSProperties } from "react";

import { useDisplay } from "@/components/os/display";
import { useWidgetContext, WidgetProvider } from "./WidgetContext";

import GlassPanel from "@/components/os/ui/GlassPanel";
import WidgetBackground from "./WidgetBackground";
import { getModuleVisualIdentity } from "./moduleVisualIdentity";

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
  sceneState?: string;
  sceneVariant?: string;
  imageUrl?: string;
  imagePosition?: string;
  imageOpacity?: number;
  imageBlur?: number;
  imageFallbackUrls?: string[];
}

export default function Widget({
  children,
  className,
  hover = true,
  accent = "default",
  contentPadding = true,
  sceneState,
  sceneVariant,
  imageUrl,
  imagePosition,
  imageOpacity,
  imageBlur,
  imageFallbackUrls,
}: Props) {
  const { tokens } = useDisplay();
  const parentContext = useWidgetContext();
  const visual = getModuleVisualIdentity(accent);

  return (
    <WidgetProvider size={parentContext.size} accent={accent} presentation={parentContext.presentation}>
    <motion.div
      whileHover={
        hover
          ? {
              y: -4,
            }
          : undefined
      }
      transition={WIDGET_TRANSITION}
      data-widget-accent={accent}
      className={clsx(
        "relative h-full w-full min-h-0",
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
          borderColor: visual.borderGlow,
          "--widget-accent": visual.accent,
          "--widget-secondary": visual.secondaryAccent,
          "--widget-panel": visual.panelGradient,
          "--widget-glow": visual.borderGlow,
        } as CSSProperties}
      >
        {/* Full widget background */}
        <WidgetBackground accent={accent} sceneState={sceneState} sceneVariant={sceneVariant} imageUrl={imageUrl} imageFallbackUrls={imageFallbackUrls} imagePosition={imagePosition} imageOpacity={imageOpacity} imageBlur={imageBlur} presentation={parentContext.presentation} />

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
    </WidgetProvider>
  );
}
