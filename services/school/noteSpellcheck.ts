import nspell from "nspell";

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
export type LocalSpellChecker = ReturnType<typeof nspell>;
const browserNspell = nspell as unknown as (dictionary: { aff: string; dic: string }) => LocalSpellChecker;

let spellCheckerPromise: Promise<LocalSpellChecker> | undefined;
let contextSpellcheckPromise: Promise<typeof import("./contextSpellcheck")> | undefined;

export function loadContextSpellcheck(): Promise<typeof import("./contextSpellcheck")> {
  contextSpellcheckPromise ??= import("./contextSpellcheck");
  return contextSpellcheckPromise;
}

const commonEnglishWords = ["the", "and", "student", "class", "assignment"];

type SpellcheckFailureCode = "FETCH_FAILED" | "INVALID_AFF" | "INVALID_DIC" | "NSPELL_INIT_FAILED" | "SANITY_CHECK_FAILED";

class SpellcheckInitializationError extends Error {
  code: SpellcheckFailureCode;

  constructor(code: SpellcheckFailureCode, message: string) {
    super(message);
    this.name = "SpellcheckInitializationError";
    this.code = code;
  }
}

function diagnostic(message: string): void {
  if (process.env.NODE_ENV !== "production") console.debug(`[spellcheck] ${message}`);
}

async function loadDictionaryAsset(path: string, kind: "AFF" | "DIC"): Promise<string> {
  let response: Response;
  try {
    response = await fetch(path);
  } catch {
    diagnostic(`${kind} fetch failed`);
    throw new SpellcheckInitializationError("FETCH_FAILED", "Dictionary asset request failed.");
  }
  const contentType = response.headers.get("content-type") ?? "unknown";
  if (!response.ok) {
    diagnostic(`${kind} fetch status=${response.status} contentType=${contentType}`);
    throw new SpellcheckInitializationError("FETCH_FAILED", "Dictionary asset request failed.");
  }
  const text = await response.text();
  diagnostic(`${kind} fetch status=${response.status} contentType=${contentType} bytes=${new TextEncoder().encode(text).byteLength}`);
  if (!text.trim()) throw new SpellcheckInitializationError(kind === "AFF" ? "INVALID_AFF" : "INVALID_DIC", "Dictionary asset is empty.");

  const normalizedText = text.replace(/^\uFEFF/, "").trimStart();
  if (/^<(?:!doctype|html|head|body)\b/i.test(normalizedText)) throw new SpellcheckInitializationError(kind === "AFF" ? "INVALID_AFF" : "INVALID_DIC", "Dictionary asset is not valid text data.");
  if (kind === "AFF" && !/^SET\s+UTF-8\b/im.test(normalizedText)) throw new SpellcheckInitializationError("INVALID_AFF", "Dictionary affix data is invalid.");
  if (kind === "DIC" && !/^\s*\d+\s*(?:\r?\n|$)/.test(normalizedText)) throw new SpellcheckInitializationError("INVALID_DIC", "Dictionary word data is invalid.");
  return text;
}

export function createLocalSpellChecker(): Promise<LocalSpellChecker> {
  spellCheckerPromise ??= Promise.all([
    loadDictionaryAsset("/dictionaries/en/index.aff", "AFF"),
    loadDictionaryAsset("/dictionaries/en/index.dic", "DIC"),
  ]).then(([aff, dic]) => {
    let checker: LocalSpellChecker;
    try {
      checker = browserNspell({aff, dic});
      diagnostic("nspell initialized");
    } catch {
      diagnostic("initialization stage=nspell_initialization");
      throw new SpellcheckInitializationError("NSPELL_INIT_FAILED", "English dictionary initialization failed.");
    }
    const recognized = commonEnglishWords.filter((word) => checker.correct(word)).length;
    const sanity = Object.fromEntries(commonEnglishWords.map((word) => [word, checker.correct(word)]));
    if (recognized < 4 || checker.correct("studnet")) {
      diagnostic(`initialization stage=sanity_check passed=false results=${JSON.stringify(sanity)}`);
      throw new SpellcheckInitializationError("SANITY_CHECK_FAILED", "English dictionary sanity check failed.");
    }
    diagnostic(`initialization stage=sanity_check passed=true results=${JSON.stringify(sanity)}`);
    return checker;
  }).catch((error: unknown) => {
    spellCheckerPromise = undefined;
    diagnostic(`failure code=${error instanceof SpellcheckInitializationError ? error.code : "UNKNOWN"}`);
    throw error;
  });

  return spellCheckerPromise;
}
