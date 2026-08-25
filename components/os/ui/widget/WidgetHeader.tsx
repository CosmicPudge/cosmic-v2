"use client";

import clsx from "clsx";
import { useWidgetContext } from "./WidgetContext";
import { getModuleVisualIdentity } from "./moduleVisualIdentity";
import { CosmicIcon } from "@/components/cosmic-icons";

interface WidgetHeaderProps {
  /**
   * Small uppercase category
   * WEATHER
   * SPORTS
   * GARAGE
   */
  eyebrow?: string;

  /**
   * Main heading
   * Logan
   * Angels
   * 2003 Civic
   */
  title: string;

  /**
   * Supporting description
   */
  subtitle?: string;

  /**
   * Optional leading icon
   */
  icon?: React.ReactNode;

  /**
   * Optional action button
   */
  action?: React.ReactNode;

  className?: string;
}

export default function WidgetHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  action,
  className,
}: WidgetHeaderProps) {
  const { size, accent } = useWidgetContext();
  const visual = getModuleVisualIdentity(accent ?? "default");
  return (
    <header
      className={clsx(
        "shrink-0",
        size === "small"
          ? "mb-4 flex items-start justify-between gap-3"
          : "mb-6 flex items-start justify-between gap-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        {(icon || accent) && (
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-white/10
              bg-white/6
              text-white/90
              backdrop-blur-xl
            "
            style={{ borderColor: visual.borderGlow, background: `${visual.accent}18` }}
          >
            {icon ?? <CosmicIcon icon={visual.icon} size={size === "small" ? 28 : 34} />}
          </div>
        )}

        <div className="min-w-0">
          {eyebrow && (
            <p
              className="
                mb-1
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.30em]
                text-white/55
              "
            >
              {eyebrow}
            </p>
          )}

          <h2
            className={clsx(
              "truncate font-semibold tracking-[-0.02em] text-white",
              size === "small" ? "text-base" : "text-xl"
            )}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              className="
                mt-1
                truncate
                text-sm
                text-white/60
              "
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="flex shrink-0 items-center">
          {action}
        </div>
      )}
    </header>
  );
}
