import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveContext,
} from "../src/glasses/context/contextResolver.ts";

const empty = {
  navigation: "",
  call: "",
  calendar: "",
  sports: "",
};

test("resolves context in navigation, call, calendar, sports order", () => {
  assert.deepEqual(
    resolveContext({
      ...empty,
      navigation: "TURN RIGHT • 350 ft",
      call: "Active Call • 00:42",
      calendar: "ENGR 1010 • 8 MIN",
      sports: "LAA 2–5 BOS ▲ 7th",
    }),
    {
      source: "navigation",
      content: "TURN RIGHT • 350 ft",
    },
  );

  assert.equal(
    resolveContext({ ...empty, call: "Active Call • 00:42", calendar: "ENGR 1010 • 8 MIN", sports: "LAA 2–5 BOS ▲ 7th" }).source,
    "call",
  );
  assert.equal(
    resolveContext({ ...empty, calendar: "ENGR 1010 • 8 MIN", sports: "LAA 2–5 BOS ▲ 7th" }).source,
    "calendar",
  );
  assert.equal(
    resolveContext({ ...empty, sports: "LAA 2–5 BOS ▲ 7th" }).source,
    "sports",
  );
  assert.deepEqual(resolveContext(empty), { source: "blank", content: "" });
});

test("newest cached sports state is immediately available after overrides end", () => {
  const sportsAtStart = "LAA 1–5 BOS ▲ 7th";
  const sportsUpdated = "LAA 2–5 BOS ▲ 7th";

  assert.equal(
    resolveContext({ ...empty, sports: sportsAtStart }).content,
    sportsAtStart,
  );
  assert.equal(
    resolveContext({
      ...empty,
      calendar: "ENGR 1010 • 8 MIN",
      sports: sportsUpdated,
    }).source,
    "calendar",
  );
  assert.equal(
    resolveContext({
      ...empty,
      navigation: "TURN RIGHT • 350 ft",
      sports: sportsUpdated,
    }).source,
    "navigation",
  );
  assert.deepEqual(
    resolveContext({ ...empty, sports: sportsUpdated }),
    { source: "sports", content: sportsUpdated },
  );
});
