"use client";

interface AppContentProps {
  children: React.ReactNode;
}

export default function AppContent({
  children,
}: AppContentProps) {
  return (
    <section className="cosmic-content-surface cosmic-page-content flex-1 overflow-y-auto backdrop-blur-xl">

      {children}

    </section>
  );
}
