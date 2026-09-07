import assert from "node:assert/strict";
import test from "node:test";

import {
  LatestWriteQueue,
} from "../src/glasses/hud/latestWriteQueue.ts";

test("writes the active value and only the newest pending value", async () => {
  const writes: string[] = [];
  let releaseFirst: (() => void) | undefined;

  const queue = new LatestWriteQueue(async (content) => {
    writes.push(content);
    if (content === "A") {
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
    }
  });

  const first = queue.enqueue("A");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const second = queue.enqueue("B");
  const third = queue.enqueue("C");

  releaseFirst?.();
  await Promise.all([first, second, third]);

  assert.deepEqual(writes, ["A", "C"]);
});

test("a failed write does not block the next value", async () => {
  const writes: string[] = [];
  const queue = new LatestWriteQueue(async (content) => {
    writes.push(content);
    if (content === "A") {
      throw new Error("simulated bridge failure");
    }
  });

  await assert.rejects(queue.enqueue("A"), /simulated bridge failure/);
  await queue.enqueue("B");

  assert.deepEqual(writes, ["A", "B"]);
});

test("stale values are discarded before reaching the writer", async () => {
  const writes: string[] = [];
  const queue = new LatestWriteQueue(async (content) => {
    writes.push(content);
  });

  await queue.enqueue("stale", () => false);
  await queue.enqueue("current");

  assert.deepEqual(writes, ["current"]);
});

test("a hung write times out so the queue can continue", async () => {
  const writes: string[] = [];
  const queue = new LatestWriteQueue(
    async (content) => {
      writes.push(content);
      if (content === "stuck") {
        await new Promise<void>(() => undefined);
      }
    },
    undefined,
    10,
  );

  await assert.rejects(queue.enqueue("stuck"), /timed out/);
  await queue.enqueue("next");

  assert.deepEqual(writes, ["stuck", "next"]);
});
