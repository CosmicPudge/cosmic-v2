"use client";

interface GridSurfaceProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export default function GridSurface({
  children,
  columns = 2,
  className = "",
}: GridSurfaceProps) {
  const cols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div
      className={`
        grid
        ${cols[columns]}
        gap-4
        ${className}
      `}
    >
      {children}
    </div>
  );
}