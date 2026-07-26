const priority = [
  "Scholarship deadline tomorrow",
  "Professor replied to your email",
  "Microsoft account security alert",
];

export default function OutlookPriority() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        PRIORITY
      </p>

      <div className="space-y-2">
        {priority.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}