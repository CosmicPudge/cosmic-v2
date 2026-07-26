export default function NotificationsPreview() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">
        TODAY
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-white">
        3 Active
      </h2>

      <p className="mt-2 text-sm text-white/60">
        You have three active notifications that may need your attention.
      </p>
    </div>
  );
}