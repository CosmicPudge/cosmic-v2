"use client";

import { ReactNode } from "react";
import { Glass } from "@/design-system/tokens/glass";
import { Radius } from "@/design-system/tokens/radius";
import { Shadows } from "@/design-system/tokens/shadows";
import { Colors } from "@/design-system/tokens/colors";

interface DashboardCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;

  className?: string;

  glass?: "xs" | "sm" | "md" | "lg";

  hover?: boolean;
}

export default function DashboardCard({
  children,
  title,
  subtitle,
  icon,
  className = "",
  glass = "md",
  hover = true,
}: DashboardCardProps) {
  const glassStyle = Glass[glass];

  return (
    <section
      className={`
        relative
        overflow-hidden
        transition-all
        duration-300
        ${hover ? "hover:-translate-y-1 hover:scale-[1.015]" : ""}
        ${className}
      `}
      style={{
        background: glassStyle.background,
        backdropFilter: `blur(${glassStyle.blur}px)`,
        WebkitBackdropFilter: `blur(${glassStyle.blur}px)`,

        borderRadius: Radius.lg,

        border: `1px solid ${Colors.border.subtle}`,

        boxShadow: `${Shadows.md}, ${Shadows.glow}`,
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-gradient-to-br from-white/[0.05] to-transparent" />

      <div className="relative z-10 p-6">

        {(title || subtitle || icon) && (
          <header className="flex items-center justify-between mb-5">

            <div>

              {title && (
                <h2
                  className="text-lg font-semibold tracking-tight"
                  style={{
                    color: Colors.text.primary,
                  }}
                >
                  {title}
                </h2>
              )}

              {subtitle && (
                <p
                  className="text-sm mt-1"
                  style={{
                    color: Colors.text.tertiary,
                  }}
                >
                  {subtitle}
                </p>
              )}

            </div>

            {icon && (
              <div className="text-white/80">
                {icon}
              </div>
            )}

          </header>
        )}

        {children}

      </div>
    </section>
  );
}