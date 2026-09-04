import { contextualScoring, confusionSets, scoreContext, scoreGrammar } from "./contextLanguageModel";
import { preserveCase, tokenizeNoteWords, type LocalSpellChecker, type NoteWordToken } from "./noteSpellcheck";

export type ContextReplacement = { start: number; end: number; original: string; replacement: string; reason?: string };
export type ContextSuggestion = { start: number; end: number; original: string; suggested: string; confidence: "HIGH" | "MEDIUM"; replacements: ContextReplacement[] };

const MAX_CANDIDATES = 8;
const BEAM_WIDTH = 8;
const realWordAlternatives: Record<string, string[]> = { ...confusionSets };

function editDistance(left: string, right: string): number {
  const row = Array.from({length: right.length + 1}, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = left[i - 1] === right[j - 1] ? diagonal : Math.min(row[j - 1] + 1, above + 1, diagonal + 1);
      diagonal = above;
    }
  }
  return row[right.length];
}

function sentenceGroups(text: string, tokens: NoteWordToken[]): NoteWordToken[][] {
  const groups: NoteWordToken[][] = [];
  let group: NoteWordToken[] = [];
  tokens.forEach((token, index) => {
    if (index && /[.!?\n]/u.test(text.slice(tokens[index - 1].end, token.start))) { if (group.length) groups.push(group); group = []; }
    group.push(token);
  });
  if (group.length) groups.push(group);
  return groups;
}

function candidatesFor(token: NoteWordToken, checker: LocalSpellChecker): string[] {
  const lower = token.word.toLocaleLowerCase();
  const candidates = [lower, ...(checker.correct(token.word) ? [] : checker.suggest(token.word)), ...(realWordAlternatives[lower] ?? [])];
  return [...new Set(candidates)].filter(Boolean).slice(0, MAX_CANDIDATES);
}

function candidateScore(original: string, candidate: string, checker: LocalSpellChecker): number {
  if (original === candidate) return checker.correct(original) ? 0 : 1.5;
  const valid = candidate.includes("'") ? true : checker.correct(candidate);
  return (valid ? 1.5 : -4) - editDistance(original, candidate) * 0.15 - (checker.correct(original) ? contextualScoring.validWordEditPenalty : 0) - contextualScoring.replacementPenalty;
}

function reasonFor(original: string, replacement: string): string | undefined {
  const pair = `${original.toLocaleLowerCase()}→${replacement.toLocaleLowerCase()}`;
  return {
    "their→they're": `"they're" fits "they are" in this context.`, "your→you're": `"you're" fits "you are" before this word.`,
    "too→to": `"to" fits this destination or action.`, "its→it's": `"it's" fits "it is" in this context.`,
    "then→than": `"than" fits this comparison.`, "there→their": `"their" fits before this noun.`,
    "era→are": `"are" fits after "who".`,
  }[pair];
}

type Beam = { words: string[]; replacements: ContextReplacement[]; score: number };

function rankSentence(tokens: NoteWordToken[], checker: LocalSpellChecker): {best: Beam; runnerUp: Beam | undefined} {
  let beam: Beam[] = [{words: [], replacements: [], score: 0}];
  tokens.forEach((token) => {
    const options = candidatesFor(token, checker);
    const next: Beam[] = [];
    beam.forEach((state) => options.forEach((candidate) => {
      const words = [...state.words, candidate];
      const replacement = candidate === token.word.toLocaleLowerCase() ? undefined : {start: token.start, end: token.end, original: token.word, replacement: preserveCase(candidate, token.word), reason: reasonFor(token.word, candidate)};
      next.push({words, replacements: replacement ? [...state.replacements, replacement] : state.replacements, score: state.score + candidateScore(token.word, candidate, checker) + scoreContext(words) - scoreContext(state.words) + scoreGrammar(words, words.length - 1)});
    }));
    beam = next.sort((left, right) => right.score - left.score).slice(0, BEAM_WIDTH);
  });
  return {best: beam[0], runnerUp: beam[1]};
}

function applyReplacements(text: string, replacements: ContextReplacement[]): string {
  return replacements.reduceRight((result, replacement) => `${result.slice(0, replacement.start)}${replacement.replacement}${result.slice(replacement.end)}`, text);
}

export function findContextSuggestions(text: string, checker: LocalSpellChecker, ignored = new Set<string>()): ContextSuggestion[] {
  const tokens = tokenizeNoteWords(text).filter((token) => !ignored.has(token.word.toLocaleLowerCase()) && !/[A-Z]{2,}\s+\d{3,4}\b/u.test(text.slice(Math.max(0, token.start - 5), token.end + 6)));
  return sentenceGroups(text, tokens).flatMap((sentence) => {
    if (sentence.length < 2 || sentence.length > 24) return [];
    const ranked = rankSentence(sentence, checker); const best = ranked.best;
    const original = sentence.map((token) => token.word.toLocaleLowerCase());
    const originalScore = scoreContext(original) + sentence.reduce((sum, token) => sum + candidateScore(token.word, token.word.toLocaleLowerCase(), checker), 0);
    const improvement = best.score - originalScore;
    const validWordChange = best.replacements.some((replacement) => checker.correct(replacement.original));
    const margin = best.score - (ranked.runnerUp?.score ?? best.score - contextualScoring.highConfidenceMargin);
    if (!best.replacements.length || improvement < (validWordChange ? contextualScoring.validWordMinimumImprovement : contextualScoring.minimumImprovement) || margin < contextualScoring.minimumMargin) return [];
    const start = sentence[0].start; const tokenEnd = sentence.at(-1)?.end ?? start; const punctuation = text.slice(tokenEnd).match(/^[.!?]+/u)?.[0] ?? ""; const end = tokenEnd + punctuation.length;
    const originalText = text.slice(start, end); const suggested = applyReplacements(originalText, best.replacements.map((replacement) => ({...replacement, start: replacement.start - start, end: replacement.end - start})));
    return [{start, end, original: originalText, suggested, confidence: margin >= contextualScoring.highConfidenceMargin ? "HIGH" : "MEDIUM", replacements: best.replacements}];
  });
}
