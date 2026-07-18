"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface CardGridProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 lg:grid-cols-2",
  3: "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
};

export default function CardGrid({
  children,
  className,
  columns = 3,
}: CardGridProps) {
  return (
    <div
      className={clsx(
        "grid gap-6",
        columnClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
}