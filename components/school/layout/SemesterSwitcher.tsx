import { ChevronDown } from "lucide-react";

export function SemesterSwitcher() {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5 text-left transition hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80"
      aria-label="Current semester: Fall 2026"
    >
      <span>
        <span className="block text-xs text-white/40">Current semester</span>
        <span className="mt-0.5 block text-sm font-medium text-white/80">Fall 2026</span>
      </span>
      <ChevronDown className="size-4 text-white/40" aria-hidden="true" />
    </button>
  );
}

export default SemesterSwitcher;
