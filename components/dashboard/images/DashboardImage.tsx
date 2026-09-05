"use client";

import { useState, type CSSProperties } from "react";

interface Props {
  src?: string;
  fallbackSrcs?: string[];
  objectPosition?: string;
  className?: string;
  alt?: string;
  loading?: "eager" | "lazy";
  opacity?: number;
  blur?: number;
}

/** Shared decorative image layer for dashboard and hero surfaces. */
export default function DashboardImage({
  src,
  fallbackSrcs = [],
  objectPosition = "center center",
  className = "",
  alt = "",
  loading = "lazy",
  opacity = 1,
  blur,
}: Props) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = [src, ...fallbackSrcs].find((candidate) => candidate && !failedSources.includes(candidate));
  if (!source) return null;

  return <img key={source} src={source} alt={alt} aria-hidden={alt ? undefined : true} loading={loading} className={`absolute inset-0 h-full w-full object-cover ${className}`} onError={() => setFailedSources((current) => current.includes(source) ? current : [...current, source])} style={{ objectPosition, opacity, ...(blur === undefined ? {} : { filter: `blur(${blur}px)` }) } as CSSProperties} />;
}
