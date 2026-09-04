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
