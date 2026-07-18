import { ReactNode } from "react";

interface DashboardGridProps {
  children: ReactNode;
}

export default function DashboardGrid({
  children,
}: DashboardGridProps) {
  return (
    <section
      className="
        grid
        grid-cols-12
        gap-6
        auto-rows-auto
      "
    >
      {children}
    </section>
  );
}