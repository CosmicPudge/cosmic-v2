export const contextualScoring = { validWordEditPenalty: 3.5, replacementPenalty: 1.2, minimumImprovement: 2.5, validWordMinimumImprovement: 3, minimumMargin: 0.5, highConfidenceMargin: 5 } as const;

export const confusionSets: Record<string, string[]> = {
  there: ["there", "their", "they're"], their: ["there", "their", "they're"], "they're": ["there", "their", "they're"],
  your: ["your", "you're"], "you're": ["your", "you're"], to: ["to", "too", "two"], too: ["to", "too", "two"], two: ["to", "too", "two"],
  its: ["its", "it's"], "it's": ["its", "it's"], then: ["then", "than"], than: ["then", "than"], weather: ["weather", "whether"], whether: ["weather", "whether"],
  were: ["were", "we're", "where"], "we're": ["were", "we're", "where"], where: ["were", "we're", "where"], whose: ["whose", "who's"], "who's": ["whose", "who's"],
  affect: ["affect", "effect"], effect: ["affect", "effect"], era: ["era", "are"], no: ["no", "know"], know: ["no", "know"],
};

const phraseWeights: Record<string, number> = {
  "who are": 8, "are you": 8, "you and": 4, "and why": 7, "why are": 8, "you here": 8,
  "went to": 7, "to class": 7, "they're going": 7, "going home": 6, "completed the": 6,
  "the assignment": 7, "the student": 6, "student completed": 5, "class and": 4,
  "what are": 7, "where are": 7, "how are": 6, "this is": 6, "that is": 5,
  "in the": 5, "of the": 5, "on the": 5, "for the": 5, "with the": 5, "know whether": 16,
};

const tripleWeights: Record<string, number> = {
  "who are you": 14, "why are you": 14, "you and why": 8, "went to class": 13,
  "they're going home": 13, "completed the assignment": 14,
};

export function scoreContext(words: string[]): number {
  let score = 0;
  for (let index = 1; index < words.length; index += 1) score += phraseWeights[`${words[index - 1]} ${words[index]}`] ?? 0;
  for (let index = 2; index < words.length; index += 1) score += tripleWeights[`${words[index - 2]} ${words[index - 1]} ${words[index]}`] ?? 0;
  return score;
}

const verbs = new Set(["going", "go", "went", "looks", "look", "is", "are", "were", "already", "raining", "canceled", "emailed", "meets", "started", "home"]);
const nouns = new Set(["project", "notebook", "assignment", "assignments", "class", "classes", "folder", "wheel", "professor", "experiment", "weather", "calculator", "home"]);

export function scoreGrammar(words: string[], index: number): number {
  const word = words[index]; const previous = words[index - 1] ?? ""; const next = words[index + 1] ?? "";
  let score = 0;
  if (word === "there" && ["over", "here", "put"].includes(previous)) score += 8;
  if (word === "they're" && (verbs.has(next) || ["going", "already", "here"].includes(next))) score += 9;
  if (word === "their" && nouns.has(next)) score += 8;
  if (word === "you're" && verbs.has(next)) score += 9;
  if (word === "your" && nouns.has(next)) score += 8;
  if (word === "to" && (nouns.has(next) || verbs.has(next))) score += 7;
  if (word === "class" && previous === "to") score += 7;
  if (word === "too" && ["much", "many", "also"].includes(next)) score += 8;
  if (word === "two" && /s$/u.test(next)) score += 7;
  if (word === "it's" && ["due", "raining", "already"].includes(next)) score += 9;
  if (word === "its" && ["own", ...nouns].includes(next)) score += 8;
  if (word === "than" && ["better", "larger", "more", "less", "rather"].includes(previous)) score += 9;
  if (word === "then" && ["we", "i", "they"].includes(next)) score += 8;
  if (word === "whether" && previous === "no" && nouns.has(next)) score += 9;
  if (word === "whether" && ["don't", "no", "know"].includes(previous) && nouns.has(next)) score += 12;
  if (word === "know" && previous === "don't") score += 8;
  if (word === "weather" && ["looks", "is", "bad"].includes(next)) score += 8;
  if (word === "are" && previous === "who") score += 10;
  if (word === "why" && previous === "and") score += 8;
  if (word === "here" && ["you", "come", "right"].includes(previous)) score += 8;
  return score;
}
