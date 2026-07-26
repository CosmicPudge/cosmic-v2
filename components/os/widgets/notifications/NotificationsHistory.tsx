const history = [
  "Yesterday • Angels game reminder",
  "2 Days Ago • Assignment submitted",
  "Last Week • System updated",
];

export default function NotificationsHistory() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        HISTORY
      </p>

      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}