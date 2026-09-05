import test from "node:test";
import assert from "node:assert/strict";
import { findNewTouchdown, touchdownKey } from "./celebration";

const play = { id: "td-1", description: "Touchdown Home", touchdown: true };
test("does not replay historical touchdowns on cold start", () => assert.equal(findNewTouchdown(new Set(), [play], false), undefined));
test("finds a later touchdown once history is initialized", () => assert.equal(findNewTouchdown(new Set(["old"]), [play], true), play));
test("dedupes stable provider ids", () => assert.equal(findNewTouchdown(new Set([touchdownKey(play)]), [play], true), undefined));
