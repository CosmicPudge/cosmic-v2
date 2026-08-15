"use client";

interface Props {
  title?: string;
  description?: string;
  compact?: boolean;
}

export default function WidgetEmpty({
  title = "Nothing here yet",
  description = "Content will appear here when available.",
  compact = false,
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h3 className={compact ? "text-xs font-medium text-white/75" : "text-base font-semibold text-white/80"}>
        {title}
      </h3>

      {description && (
        <p className={compact ? "mt-1 max-w-xs text-xs text-white/50" : "mt-2 max-w-xs text-sm text-white/50"}>
          {description}
        </p>
      )}
    </div>
  );
}
