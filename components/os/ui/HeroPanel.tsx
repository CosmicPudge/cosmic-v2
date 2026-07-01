"use client";

import { ReactNode } from "react";

interface HeroPanelProps {
  eyebrow: string;
  title: string;
  subtitle?: string;

  status?: ReactNode;

  children?: ReactNode;
}

export default function HeroPanel({
  eyebrow,
  title,
  subtitle,
  status,
  children,
}: HeroPanelProps) {
  return (
    <section
      className="
        rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur-xl
        p-8
        overflow-hidden
      "
    >
      <div className="flex items-start justify-between">

        <div>

          <p className="
            text-xs
            uppercase
            tracking-[0.35em]
            text-white/40
          ">
            {eyebrow}
          </p>

          <h1 className="
            mt-3
            text-5xl
            font-bold
            leading-none
          ">
            {title}
          </h1>

          {subtitle && (
            <p className="
              mt-3
              text-xl
              text-white/65
            ">
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