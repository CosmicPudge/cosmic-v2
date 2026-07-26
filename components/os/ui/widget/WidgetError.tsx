"use client";

interface Props {
  title?: string;
  message?: string;
}

export default function WidgetError({
  title = "Something went wrong",
  message = "Please try again later.",
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-xs text-sm text-white/55">
        {message}
      </p>
    </div>
  );
}