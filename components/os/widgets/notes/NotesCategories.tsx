const categories = [
  "School",
  "Projects",
  "Garage",
  "Ideas",
];

export default function NotesCategories() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        CATEGORIES
      </p>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70"
          >
            {category}
          </span>
        ))}
      </div>
    </div>
  );
}