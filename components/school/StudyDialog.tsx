"use client";

import { createPortal } from "react-dom";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

export function StudyDialog({ title, children, footer, onClose }: { title: string; children: ReactNode; footer: ReactNode; onClose: () => void }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] box-border flex items-center justify-center overflow-hidden bg-black/60 p-3 sm:p-6" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="study-dialog-title" className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101c35] sm:max-h-[calc(100dvh-3rem)]">
        <header className="shrink-0 border-b border-white/10 px-5 py-4">
          <h2 id="study-dialog-title" className="text-xl font-semibold text-white">{title}</h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#101c35] px-5 py-4 sm:flex-row sm:justify-end">{footer}</footer>
      </section>
    </div>,
    document.body,
  );
}
