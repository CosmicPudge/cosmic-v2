"use client";

interface AppGridProps {
  children: React.ReactNode;
}

export default function AppGrid({
  children,
}: AppGridProps) {
  return (
    <div className="grid grid-cols-12 gap-6">

      {children}

    </div>
  );
}
