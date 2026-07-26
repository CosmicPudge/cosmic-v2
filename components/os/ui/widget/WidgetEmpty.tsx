"use client";

interface Props {
  title?: string;
  description?: string;
}

export default function WidgetEmpty({
  title = "Nothing here yet",
  description = "Content will appear here when available.",
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h3 className="text-base font-semibold text-white/80">
        {title}
      </h3>

      <p className="mt-2 max-w-xs text-sm text-white/50">
        {description}
      </p>
    </div>
  );
}