import assert from "node:assert/strict";
import test from "node:test";

import type {
  CosmicSportsGame,
  CosmicSportsLive,
  CosmicSportsResponse,
} from "../src/glasses/data/sportsClient.ts";
import {
  formatSportsContext,
} from "../src/glasses/hud/sportsContext.ts";

const liveBase: CosmicSportsGame = {
  state: "live",
  opponent: "Boston Red Sox",
  gameDate: "2026-09-07T17:35:00.000Z",
  isHome: false,
  awayAbbr: "LAA",
  homeAbbr: "BOS",
  awayScore: 2,
  homeScore: 5,
  status: "In Progress",
};

const baseballLiveBase: CosmicSportsLive = {
  inning: 7,
  inningHalf: "top",
  period: null,
  outs: 2,
  balls: 1,
  strikes: 2,
  firstBase: true,
  secondBase: false,
  thirdBase: true,
  batter: "Batter",
  pitcher: "Pitcher",
  playDescription: null,
};

function response(
  game: Partial<CosmicSportsGame> | null,
): CosmicSportsResponse {
  return {
    game: game === null
      ? null
      : { ...liveBase, ...game },
  };
}

function baseballGame(
  live: Partial<CosmicSportsLive> = {},
) {
  return response({
    live: { ...baseballLiveBase, ...live },
  });
}

test("formats a live MLB top inning with baseball detail", () => {
  assert.equal(
    formatSportsContext(baseballGame()),
    "LAA 2–5 BOS ▲ 7th\n2 OUT • 1–2 • ◆◇◆",
  );
});

test("formats a live MLB bottom inning without an extra bullet", () => {
  assert.equal(
    formatSportsContext(baseballGame({
      inning: 9,
      inningHalf: "bottom",
    })),
    "LAA 2–5 BOS ▼ 9th\n2 OUT • 1–2 • ◆◇◆",
  );
});

test("uses an ordinal when the inning half is unknown", () => {
  assert.equal(
    formatSportsContext(baseballGame({
      inning: 11,
      inningHalf: null,
    })),
    "LAA 2–5 BOS 11th\n2 OUT • 1–2 • ◆◇◆",
  );
});

test("formats zero, one, and two outs with the singular OUT label", () => {
  for (const outs of [0, 1, 2]) {
    const lines = formatSportsContext(
      baseballGame({ outs }),
    ).split("\n");

    assert.equal(lines[1]?.startsWith(`${outs} OUT`), true);
  }
});

test("formats every supported base occupancy in first, second, third order", () => {
  const cases: [Partial<CosmicSportsLive>, string][] = [
    [{ firstBase: false, secondBase: false, thirdBase: false }, "◇◇◇"],
    [{ firstBase: true, secondBase: false, thirdBase: false }, "◆◇◇"],
    [{ firstBase: false, secondBase: true, thirdBase: false }, "◇◆◇"],
    [{ firstBase: false, secondBase: false, thirdBase: true }, "◇◇◆"],
    [{ firstBase: true, secondBase: false, thirdBase: true }, "◆◇◆"],
    [{ firstBase: true, secondBase: true, thirdBase: true }, "◆◆◆"],
  ];

  for (const [live, expectedBases] of cases) {
    assert.equal(
      formatSportsContext(baseballGame(live)).split("\n")[1],
      `2 OUT • 1–2 • ${expectedBases}`,
    );
  }
});

test("marks missing scores as unavailable without fabricating zero", () => {
  assert.equal(
    formatSportsContext({
      game: {
        ...liveBase,
        awayScore: null,
        live: { ...baseballLiveBase },
      },
    }),
    "LAA —–5 BOS ▲ 7th\n2 OUT • 1–2 • ◆◇◆",
  );
});

test("omits invalid or unavailable baseball fields", () => {
  assert.equal(
    formatSportsContext(baseballGame({
      outs: 3,
      balls: 4,
      strikes: 3,
    })),
    "LAA 2–5 BOS ▲ 7th\n◆◇◆",
  );

  assert.equal(
    formatSportsContext(baseballGame({
      firstBase: null,
      secondBase: null,
      thirdBase: null,
    })),
    "LAA 2–5 BOS ▲ 7th\n2 OUT • 1–2",
  );
});

test("clears scheduled, final, and null games", () => {
  for (const game of [
    { ...liveBase, state: "pregame" },
    { ...liveBase, state: "final" },
    null,
  ]) {
    assert.equal(formatSportsContext(response(game)), "");
  }
});

test("preserves the generic non-MLB period fallback", () => {
  assert.equal(
    formatSportsContext(response({
      live: { period: "Q3" } as CosmicSportsLive,
    })),
    "LAA 2–5 BOS • Q3",
  );
});

test("truncates each line independently", () => {
  const lines = formatSportsContext(response({
    awayAbbr: "AWAYTEAM",
    homeAbbr: "HOMETEAM",
    live: {
      ...baseballLiveBase,
      inning: 12,
      inningHalf: "bottom",
    },
  })).split("\n");

  assert.equal(lines.length, 2);
  assert.equal(lines.every((line) => line.length <= 25), true);
  assert.equal(lines[1]?.endsWith("…"), false);
});
