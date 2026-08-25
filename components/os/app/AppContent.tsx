"use client";

interface AppContentProps {
  children: React.ReactNode;
}

export default function AppContent({
  children,
}: AppContentProps) {
  return (
    <section className="cosmic-content-surface flex-1 overflow-y-auto rounded-[1.5rem] p-3 backdrop-blur-xl sm:p-5 lg:p-7">

      {children}

    </section>
  );
}
