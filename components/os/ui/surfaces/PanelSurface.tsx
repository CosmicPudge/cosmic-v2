"use client";

interface PanelSurfaceProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function PanelSurface({
  title,
  subtitle,
  children,
  className = "",
}: PanelSurfaceProps) {
  return (
    <section
      className={`
        rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur-xl
        p-8
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-6">

          {title && (
            <h2 className="text-2xl font-bold">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="mt-1 text-white/60">
              {subtitle}
            </p>
          )}

        </div>
      )}

      {children}
    </section>
  );
}