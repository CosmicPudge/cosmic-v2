const clocks = [
  {
    city: "Logan",
    time: "12:00 PM",
  },
  {
    city: "New York",
    time: "2:00 PM",
  },
  {
    city: "Tokyo",
    time: "3:00 AM",
  },
];

export default function ClockWorld() {
  return (
    <div className="space-y-2">
      {clocks.map((clock) => (
        <div
          key={clock.city}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <span className="text-white">
            {clock.city}
          </span>

          <span className="text-white/60">
            {clock.time}
          </span>
        </div>
      ))}
    </div>
  );
}