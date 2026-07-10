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
    <GlassPanel className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-3xl font-bold">
        {title}
      </h2>

      <p className="mt-4 max-w-md text-white/60">
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