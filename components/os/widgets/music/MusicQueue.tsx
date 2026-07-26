const queue = [
  "No upcoming tracks",
];

export default function MusicQueue() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        QUEUE
      </p>

      <div className="space-y-2">
        {queue.map((song) => (
          <div
            key={song}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
          >
            {song}
          </div>
        ))}
      </div>
    </div>
  );
}