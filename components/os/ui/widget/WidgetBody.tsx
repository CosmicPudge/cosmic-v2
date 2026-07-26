"use client";

import clsx from "clsx";

interface WidgetBodyProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
}

export default function WidgetBody({
  children,
  className,
  centered = false,
}: WidgetBodyProps) {
  return (
    <div
      className={clsx(
        "relative flex-1",
        centered
          ? "flex items-center justify-center"
          : "flex flex-col gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}