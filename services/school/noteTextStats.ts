export interface NoteTextStats {
  words: number;
  characters: number;
}

/** Counts the note body exactly as written; Markdown syntax is intentionally included. */
export function getTextStats(text: string): NoteTextStats {
  return {
    words: text.trim() ? text.trim().split(/\s+/u).length : 0,
    characters: text.length,
  };
}
