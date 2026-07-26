"use client";

import { ReactNode } from "react";
import DashboardCard from "../shared/DashboardCard";

interface WidgetContainerProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  glass?: "xs" | "sm" | "md" | "lg";
}

export default function WidgetContainer({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = "",
  glass = "md",
}: WidgetContainerProps) {
  return (
    <DashboardCard
      title={title}
      subtitle={subtitle}
      icon={
        <div className="flex items-center gap-3">
          {icon}
          {actions}
        </div>
      }
      className={className}
      glass={glass}
    >
      <div className="flex h-full flex-col">
        {children}
      </div>
    </DashboardCard>
  );
}