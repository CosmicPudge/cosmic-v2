const items = [
  {
    title: "Weather",
    value: "84° • Sunny",
  },
  {
    title: "Calendar",
    value: "No upcoming events",
  },
  {
    title: "Projects",
    value: "Everything on schedule",
  },
  {
    title: "Garage",
    value: "Vehicle ready",
  },
];

export default function CosmicBriefing() {
  return (
    <div className="space-y-3">
      {items.map((item) => (
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