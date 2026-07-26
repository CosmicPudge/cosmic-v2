const actions = [
  "Weather",
  "Calendar",
  "Projects",
  "Garage",
];

export default function CosmicActions() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        QUICK ACTIONS
      </p>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action}
            className="
              rounded-xl
              border
              border-white/10
              bg-white/5
              p-3
              text-sm
              text-white
              transition-all
              hover:bg-white/10
            "
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}