const summary = [
  {
    title: "Weather",
    value: "Sunny • 84°",
  },
  {
    title: "Calendar",
    value: "No events today",
  },
  {
    title: "Projects",
    value: "Everything on schedule",
  },
];

export default function BriefingSummary() {
  return (
    <div className="space-y-3">
      {summary.map((item) => (
        <div
          key={item.title}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <span className="text-white/60">
            {item.title}
          </span>

          <span className="font-medium text-white">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}