"use client";

interface Props {
  children: React.ReactNode;
}

export default function WidgetFooter({
  children,
}: Props) {
  return (
    <div className="mt-5 border-t border-white/10 pt-4 text-sm text-white/45">
      {children}
    </div>
  );
}