"use client";

interface Props {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export default function WidgetError({
  title = "Something went wrong",
  message = "Please try again later.",
  action,
  compact = false,
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h3 className={compact ? "text-sm font-semibold text-white" : "text-lg font-semibold text-white"}>
        {title}
      </h3>

      <p className={compact ? "mt-1 max-w-xs text-xs text-white/55" : "mt-2 max-w-xs text-sm text-white/55"}>
        {message}
      </p>

      {action && <div className={compact ? "mt-2" : "mt-4"}>{action}</div>}
    </div>
  );
}
