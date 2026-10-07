"use client";

import clsx from "clsx";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={clsx("cosmos-skeleton rounded-xl", className)} />;
}
