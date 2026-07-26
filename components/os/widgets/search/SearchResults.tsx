const results = [
  "Weather Widget",
  "Projects Dashboard",
  "Garage",
];

export default function SearchResults() {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">
        RESULTS
      </p>

      <div className="space-y-2">
        {results.map((result) => (
          <div
            key={result}
            className="
              rounded-xl
              border
              border-white/10
              bg-white/5
              p-4
              text-white
            "
          >
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}