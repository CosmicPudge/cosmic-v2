import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function WidgetHero({
  children,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        `
        rounded-[32px]
        bg-white/6

        border
        border-white/10

        backdrop-blur-xl

        p-6
        `,
        className
      )}
    >
      {children}
    </div>
  );
}