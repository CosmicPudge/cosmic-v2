"use client";

import GlassPanel from "./GlassPanel";
import Button from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <GlassPanel className="cosmic-panel flex flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
        {description}
      </p>

      {actionLabel && (
        <Button
          className="mt-8"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </GlassPanel>
  );
}
