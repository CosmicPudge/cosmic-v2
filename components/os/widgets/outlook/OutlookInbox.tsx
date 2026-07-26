export default function OutlookInbox() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">
        INBOX
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-white">
        12
      </h2>

      <p className="mt-2 text-sm text-white/60">
        Unread messages
      </p>
    </div>
  );
}