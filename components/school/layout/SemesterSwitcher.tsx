import { currentSchoolTermLabel } from "@/services/school/trustPresentation";
import { useSchool } from "../context/SchoolDataContext";

export function SemesterSwitcher() {
  const { local } = useSchool();
  const termLabel = local.ready ? currentSchoolTermLabel(local.data.terms) : "Loading…";
  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5" role="group" aria-label={`Current term: ${termLabel}`}>
      <span>
        <span className="block text-xs text-white/40">Current term</span>
        <span className="mt-0.5 block text-sm font-medium text-white/80">{termLabel}</span>
      </span>
    </div>
  );
}

export default SemesterSwitcher;
