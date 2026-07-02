"use client";

import { useRouter } from "next/navigation";

interface WidgetCardProps {
  route: string;
  children: React.ReactNode;
}

export default function WidgetCard({
  route,
  children,
}: WidgetCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(route)}
      className="
        w-full
        text-left
        transition-all
        duration-300
        hover:scale-[1.01]
        hover:-translate-y-1
        active:scale-[0.99]
      "
    >
      {children}
    </button>
  );
}