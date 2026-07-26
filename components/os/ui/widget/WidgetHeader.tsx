"use client";

import clsx from "clsx";

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
  return (
    <header
      className={clsx(
        "mb-8 flex items-start justify-between gap-6",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        {icon && (
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
          >
            {icon}
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
            className="
              truncate
              text-xl
              font-semibold
              tracking-[-0.02em]
              text-white
            "
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