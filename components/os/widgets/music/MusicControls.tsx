const controls = ["⏮", "▶", "⏭"];

export default function MusicControls() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {controls.map((control) => (
        <button
          key={control}
          className="
            rounded-xl
            border
            border-white/10
            bg-white/5
            py-3
            text-xl
            text-white
            transition
            hover:bg-white/10
          "
        >
          {control}
        </button>
      ))}
    </div>
  );
}