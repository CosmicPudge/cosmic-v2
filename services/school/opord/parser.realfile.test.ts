import assert from "node:assert/strict";
import test from "node:test";
import { parseAfrotcOpord } from "./parser";

test("does not let the page-1 attachment TOC truncate real event discovery", () => {
  const result = parseAfrotcOpord({ sourceId: "week-02", sourceName: "Week 02 OPORD", text: `--- PAGE 1 ---
Contents Description Page #
1. Leadership Laboratory (LLAB) Marching Basics 2
Attachment 4 - Physical Training Plan 13
--- PAGE 2 ---
1. Leadership Laboratory (LLAB)
Situation
Marching Basics
Date/Time
Thursday (10 Sep 2026) from 1500 to 1700
Form-Up Location
HPER 201
--- PAGE 4 ---
2-1. Physical Training (PT) - Monday
Situation
LABOR DAY - NO PT
Date/Time
Monday (7 Sep 2026) from 0600 - 0700
Form-Up Location
N/A
--- PAGE 5 ---
2-2. Physical Training (PT) - Wednesday
Situation
Running Seminar
Date/Time
Wednesday (9 Sep 2026) from 0600 - 0700
Form-Up Location
Legacy Fields
--- PAGE 6 ---
2-3. Physical Training (PT) - Friday
Situation
343 Mentor Challenge
Date/Time
Friday (11 Sep 2026) from 0600 - 0700
Form-Up Location
Legacy Fields
--- PAGE 13 ---
Attachment 4 - Physical Training Plan
Wednesday:
Slow Repetitions Workout` });

  assert.equal(result.events.length, 4);
  assert.deepEqual(result.events.map((event) => event.diagnostics?.sourcePage), [2, 4, 5, 6]);
  assert.deepEqual(result.events.map((event) => event.type), ["llab", "pt", "pt", "pt"]);
  assert.equal(result.events.some((event) => /ORM|catastrophic|approval/i.test(event.title)), false);
});

test("reconstructs wrapped LLAB UOD columns from PDF item positions", () => {
  const result = parseAfrotcOpord({ sourceId: "week-02", sourceName: "Week 02 OPORD", text: `--- PAGE 2 ---
1. Leadership Laboratory (LLAB)
Situation
Marching Basics
Date/Time
Thursday (10 Sep 2026) from 1500 to 1700
Form-Up Location
HPER 201`, layout: [
    { page: 2, text: "First Term Cadets", x: 100, y: 600, width: 90 },
    { page: 2, text: "GMC", x: 250, y: 600, width: 30 },
    { page: 2, text: "POC", x: 350, y: 600, width: 30 },
    { page: 2, text: "Det Polo (Utility)", x: 100, y: 580, width: 100 },
    { page: 2, text: "OCP (AAS/i5", x: 250, y: 580, width: 80 },
    { page: 2, text: "OCP / FDU", x: 350, y: 580, width: 70 },
    { page: 2, text: "Patches Authorized)", x: 250, y: 565, width: 100 },
    { page: 2, text: "(AAS/i5 Patches", x: 350, y: 565, width: 100 },
    { page: 2, text: "Authorized)", x: 350, y: 550, width: 70 },
    { page: 2, text: "Schedule", x: 100, y: 500, width: 55 },
  ] });
  const event = result.events[0];
  assert.deepEqual(event.uniformRequirements.map((item) => item.audience), ["First Term Cadets", "GMC", "POC"]);
  assert.equal(event.uniformRequirements[0].uniform, "Det Polo (Utility)");
  assert.equal(event.uniformRequirements[1].uniform, "OCP (AAS/i5 Patches Authorized)");
  assert.equal(event.uniformRequirements[2].uniform, "OCP / FDU (AAS/i5 Patches Authorized)");
  assert.equal(new Set(event.uniformRequirements.map((item) => item.uniform)).size, 3);
});

test("parses semantic week metadata without using detachment, year, or page numbers", () => {
  for (const [label, number] of [["Week 2", 2], ["Week_03", 3], ["WEEK-04", 4]] as const) {
    const result = parseAfrotcOpord({ sourceId: "week", sourceName: "Det 860_2026.pdf", text: `Detachment 860\n${label} SPMT OPORD\n2026\n--- PAGE 12 ---` });
    assert.equal(result.weekNumber, number);
    assert.equal(result.weekLabel, `Week ${String(number).padStart(2, "0")}`);
  }
});
