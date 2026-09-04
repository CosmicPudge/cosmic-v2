const phraseWeights: Record<string, number> = {
  "who are": 8, "are you": 8, "you and": 4, "and why": 7, "why are": 8, "you here": 8,
  "went to": 7, "to class": 7, "they're going": 7, "going home": 6, "completed the": 6,
  "the assignment": 7, "the student": 6, "student completed": 5, "class and": 4,
  "what are": 7, "where are": 7, "how are": 6, "this is": 6, "that is": 5,
  "in the": 5, "of the": 5, "on the": 5, "for the": 5, "with the": 5,
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
