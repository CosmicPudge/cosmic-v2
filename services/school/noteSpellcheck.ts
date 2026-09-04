export interface NoteWordToken { word: string; start: number; end: number; }
export interface SpellIssue extends NoteWordToken { suggestions: string[]; }

const wordPattern = /[A-Za-z]+(?:['’][A-Za-z]+)*/gu;
const ignoredPattern = /^(?:https?:\/\/|mailto:|[^\s@]+@[^\s@]+|[./\\]|0x[\da-f]+|[\w.-]+\/)[^\s]*$/iu;

function inCode(text: string, start: number, end: number): boolean {
  const before = text.slice(0, start);
  const fenced = (before.match(/^\s*```/gim) ?? []).length;
  if (fenced % 2 === 1) return true;
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = text.indexOf("\n", end);
  const line = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd);
  return line.slice(0, start - lineStart).includes("`") && line.slice(end - lineStart).includes("`");
}

export function tokenizeNoteWords(text: string): NoteWordToken[] {
  return [...text.matchAll(wordPattern)].flatMap((match) => {
    const word = match[0]; const start = match.index ?? 0; const end = start + word.length;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", end);
    const lineToken = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd).trim();
    if (inCode(text, start, end) || ignoredPattern.test(lineToken) || /[_$]/u.test(lineToken)) return [];
    return [{ word, start, end }];
  });
}

export function preserveCase(replacement: string, original: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
  return replacement.toLowerCase();
}

export function scanNoteText(text: string, correct: (word: string) => boolean, suggest: (word: string) => string[], ignored = new Set<string>()): SpellIssue[] {
  return tokenizeNoteWords(text).filter((token) => !ignored.has(token.word.toLocaleLowerCase()) && !correct(token.word)).map((token) => ({ ...token, suggestions: suggest(token.word).slice(0, 3) }));
}
