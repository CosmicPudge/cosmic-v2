export function normalizeSourceText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/[\u0000\u0008\u000b\u000c\u000e-\u001f]/g, " ").replace(/[ \t]+/g, " ").split("\n").map((line) => line.trim()).filter(Boolean).join("\n").trim();
}
