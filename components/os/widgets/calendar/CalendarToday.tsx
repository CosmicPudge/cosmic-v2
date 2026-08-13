export default function CalendarToday() {
  const today = new Date();

  return (
    <div className="h-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">
        Today
      </p>

      <h3 className="mt-1 text-lg font-semibold text-white">
        {today.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}
      </h3>

      <p className="text-xs text-white/50">
        {today.toLocaleDateString("en-US", {
          weekday: "long",
        })}
      </p>
    </div>
  );
}