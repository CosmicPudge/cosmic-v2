export default function CalendarToday() {
  const today = new Date();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">
        Today
      </p>

      <h3 className="mt-2 text-3xl font-bold text-white">
        {today.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}
      </h3>

      <p className="text-white/60">
        {today.toLocaleDateString("en-US", {
          weekday: "long",
        })}
      </p>
    </div>
  );
}