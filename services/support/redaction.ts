const SECRET_PATTERNS = [
  /bearer\s+[a-z0-9._~+/=-]+/gi,
  /(authorization|cookie|set-cookie|api[-_ ]?key|secret|token|password|database_url|stripe)[=:]\s*[^\s,;]+/gi,
  /(?:sk|rk|whsec)_[a-z0-9_]+/gi,
  /\b[A-HJ-NPR-Z0-9]{17}\b/gi,
];

export function redactSensitiveText(value: unknown, maxLength = 500) {
  let text = typeof value === "string" ? value : String(value ?? "");
  for (const pattern of SECRET_PATTERNS) text = text.replace(pattern, "[redacted]");
  return text.slice(0, maxLength);
}

export function safeErrorSummary(value: unknown) {
  return redactSensitiveText(value instanceof Error ? value.message : value, 300).replace(/[\r\n]+/g, " ");
}
