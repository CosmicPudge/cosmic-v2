import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { canvasPaginated, nextCanvasPage } from "./client.ts";

test("follows opaque Canvas Link-header pagination", async () => {
  const calls: string[] = [];
  const fetchImpl = async (input: RequestInfo | URL) => {
    calls.push(String(input));
    const page = calls.length === 1 ? [{ id: 1 }] : [{ id: 2 }];
    const headers = new Headers(calls.length === 1 ? { link: '<https://canvas.example.test/api/v1/courses?page=2>; rel="next"' } : {});
    return new Response(JSON.stringify(page), { status: 200, headers });
  };
  const result = await canvasPaginated<{ id: number }>("https://canvas.example.test", "secret-not-printed", "courses", new URLSearchParams([ ["per_page", "100"] ]), 5, fetchImpl);
  assert.deepEqual(result.items, [{ id: 1 }, { id: 2 }]);
  assert.equal(result.truncated, false);
  assert.equal(calls.length, 2);
  assert.equal(nextCanvasPage(new Headers({ link: '<https://canvas.example.test/next>; rel="next"' })), "https://canvas.example.test/next");
});

test("pagination reports a bounded truncation instead of looping", async () => {
  const fetchImpl = async () => new Response('[{"id":1}]', { status: 200, headers: { link: '<https://canvas.example.test/next>; rel="next"' } });
  const result = await canvasPaginated<unknown>("https://canvas.example.test", "token", "courses", new URLSearchParams(), 2, fetchImpl);
  assert.equal(result.truncated, true);
  assert.equal(result.items.length, 2);
});
