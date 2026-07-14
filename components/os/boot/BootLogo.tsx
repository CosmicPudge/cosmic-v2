"use client";

interface BootLogoProps {
  subtitle?: string;
}

export default function BootLogo({
  subtitle,
}: BootLogoProps) {
  return (
    <div className="text-center">
      <h1
        className="
          animate-cosmic-logo
          text-6xl
          font-thin
          tracking-[0.55em]
          text-white
        "
      >
        COSMIC
      </h1>

      {subtitle && (
        <p className="mt-5 text-lg uppercase tracking-[0.55em] text-white/50">
          {subtitle}
        </p>
      )}
    </div>
  );
}