import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import nspell from "nspell";
import test from "node:test";
import {findContextSuggestions} from "./contextSpellcheck";

let spellPromise: Promise<ReturnType<typeof nspell>> | undefined;

function getSpell(): Promise<ReturnType<typeof nspell>> {
  spellPromise ??= Promise.all([readFile("public/dictionaries/en/index.aff"), readFile("public/dictionaries/en/index.dic")]).then(([aff, dic]) => nspell({aff, dic}));
  return spellPromise;
}

test("corrects multiple typos with sentence context", async () => {
  const suggestion = findContextSuggestions("Who era yuo and wyh are you hree?", await getSpell())[0];
  assert.equal(suggestion?.suggested, "Who are you and why are you here?");
  assert.deepEqual(suggestion?.replacements.map(({original, replacement}) => [original, replacement]), [["era", "are"], ["yuo", "you"], ["wyh", "why"], ["hree", "here"]]);
});

test("keeps ordinary correct prose and protected identifiers unchanged", async () => {
  const spell = await getSpell();
  assert.equal(findContextSuggestions("The student completed the assignment.", spell).length, 0);
  assert.equal(findContextSuggestions("ENGR 1010 meets Friday.", spell).length, 0);
});

test("handles common real-word and ordinary spelling mistakes", async () => {
  const spell = await getSpell();
  assert.equal(findContextSuggestions("I went too class.", spell)[0]?.suggested, "I went to class.");
  assert.equal(findContextSuggestions("The studnet completed the assingment.", spell)[0]?.suggested, "The student completed the assignment.");
});

test("protects ambiguity cases and informal school notes", async () => {
  const spell = await getSpell();
  const unchanged = [
    "Put it over there.", "Is that your notebook?", "I ate too much.", "I have two assignments.",
    "The project has its own folder.", "Then we went home.", "The weather looks bad.", "I'm gonna finish it tonight.",
    "Exam Friday", "Need calculator", "Project due soon", "CHEM 1210 exam Friday.",
  ];
  unchanged.forEach((text) => assert.equal(findContextSuggestions(text, spell).length, 0, text));
  assert.equal(findContextSuggestions("Their goign too clas.", spell)[0]?.suggested, "They're going to class.");
  assert.equal(findContextSuggestions("I don't no weather class is canceled.", spell)[0]?.suggested, "I don't know whether class is canceled.");
  assert.equal(findContextSuggestions("This class is better then that one.", spell)[0]?.suggested, "This class is better than that one.");
});
