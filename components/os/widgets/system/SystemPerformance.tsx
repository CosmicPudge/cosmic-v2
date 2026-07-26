const stats = [
  { label: "CPU", value: "12%" },
  { label: "Memory", value: "4.8 GB" },
  { label: "GPU", value: "18%" },
];

export default function SystemPerformance() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <p className="text-xs uppercase tracking-widest text-white/45">
            {stat.label}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}