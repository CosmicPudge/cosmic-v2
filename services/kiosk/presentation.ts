export function formatKioskSchoolAssignment(title: string, course?: string) {
  const suffix = title.match(/\s*\[([^\]]+)\]\s*$/);
  const code = suffix?.[1].match(/\b([A-Z]{2,6})-(\d{3,5})(?:-\d{3})?\b/i);
  return {
    title: (suffix ? title.slice(0, suffix.index ?? title.length).trim() : title).trim(),
    course: code ? `${code[1].toUpperCase()} ${code[2]}` : course,
  };
}

export function compactKioskLocation(location?: string) {
  if (!location?.trim()) return undefined;
  const normalized = location.replace(/\s+/g, " ").trim();
  const department = normalized.match(/^Department of\s+([^,]+)/i);
  if (department) return department[1].trim();
  const organization = normalized.match(/\b(?:University|Utah State University)\s*-\s*([^,]+)/i);
  if (organization) return organization[1].trim();
  return normalized.split(",")[0].trim();
}
