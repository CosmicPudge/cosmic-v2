const STORAGE_KEY = "cosmic.school.assignment-completion-overrides.v1";

export function readSchoolCompletionOverrides(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 500) : []);
  } catch { return new Set(); }
}

export function setSchoolCompletionOverride(id: string, completed: boolean) {
  if (typeof window === "undefined" || !id) return;
  const overrides = readSchoolCompletionOverrides();
  if (completed) overrides.add(id); else overrides.delete(id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...overrides].slice(0, 500)));
  window.dispatchEvent(new CustomEvent("cosmic:school-completion-changed"));
}
