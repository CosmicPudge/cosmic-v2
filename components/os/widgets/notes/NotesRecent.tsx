const notes = [
  "Finish Cosmic widgets",
  "Plan Weather improvements",
  "Review Garage features",
];

export default function NotesRecent() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        RECENT
      </p>

      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
          >
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}