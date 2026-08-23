import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import Link from "next/link";

export default function FilesPage() {
  return (
    <AppShell>
      <AppHeader
        title="Files"
        subtitle="Files application"
      />

      <AppContent>
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/50">Files foundation</p><h2 className="mt-2 text-2xl font-bold text-white">Your files stay in their owning app</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Cosmic does not yet provide a general-purpose cloud file browser. Garage documents, provider attachments, and local exports remain available from their respective modules without pretending this route can manage them.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/garage" className="rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-white/75 hover:bg-white/[0.1]">Open Garage documents</Link><Link href="/settings#privacy-data" className="rounded-xl border border-white/12 px-4 py-2 text-sm text-white/65 hover:bg-white/[0.08]">Review local exports</Link></div></section>
      </AppContent>
    </AppShell>
  );
}
