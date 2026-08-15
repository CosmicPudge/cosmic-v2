import type { ReactNode } from "react";

interface AmbientSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function AmbientSection({
  title,
  children,
  className = "",
}: AmbientSectionProps) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-black/20 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-5 ${className}`}
    >
      <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.28em] text-cyan-100/42">
        {title}
      </h2>
      {children}
    </section>
  );
}
