export default function SearchInput() {
  return (
    <input
      type="text"
      placeholder="Search Cosmic..."
      className="
        w-full
        rounded-xl
        border
        border-white/10
        bg-white/5
        px-4
        py-3
        text-white
        placeholder:text-white/40
        outline-none
        focus:border-cyan-400/40
      "
    />
  );
}