"use client";

interface HeroSurfaceProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function HeroSurface({
  eyebrow,
  title,
  subtitle,
  status,
  children,
  className = "",
}: HeroSurfaceProps) {
  return (
    <section
      className={`
        relative
        overflow-hidden
        rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur-xl
        p-10
        ${className}
      `}
    >
      <div className="flex items-start justify-between">

        <div>

          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-3 text-6xl font-black tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 text-xl text-white/60">
              {subtitle}
            </p>
          )}

        </div>

        {status && (
          <div>
            {status}
          </div>
        )}

      </div>

      {children && (
        <div className="mt-10">
          {children}
        </div>
      )}

    </section>
  );
}