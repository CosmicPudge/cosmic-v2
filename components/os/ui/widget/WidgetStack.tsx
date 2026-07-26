import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function WidgetStack({
  children,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}