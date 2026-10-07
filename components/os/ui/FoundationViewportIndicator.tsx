export default function FoundationViewportIndicator() {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
      <span className="text-white/40">Viewport</span>
      <strong className="font-semibold text-cyan-100 sm:hidden">Mobile</strong>
      <strong className="hidden font-semibold text-cyan-100 sm:inline lg:hidden">Tablet</strong>
      <strong className="hidden font-semibold text-cyan-100 lg:inline">Desktop</strong>
    </div>
  );
}
