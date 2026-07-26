const agenda = [
  "Review project progress",
  "Check weather before leaving",
  "No assignments due today",
];

export default function BriefingAgenda() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        TODAY
      </p>

      <div className="space-y-2">
        {agenda.map((item) => (
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