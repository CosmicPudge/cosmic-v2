"use client";

import { useRouter } from "next/navigation";

interface AppCardProps {
  title: string;
  route: string;
  children: React.ReactNode;
}

export default function AppCard({
  title,
  route,
  children,
}: AppCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(route)}
      className="
        group
        w-full
        rounded-3xl
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