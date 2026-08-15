"use client";

interface AppContentProps {
  children: React.ReactNode;
}

export default function AppContent({
  children,
}: AppContentProps) {
  return (
    <section className="flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-8">

      {children}

    </section>
  );
}
