import { test } from "node:test";
import assert from "node:assert/strict";
import { ParamsRefresher, BUILTIN_PARAMS } from "./params.js";

function fakeFetch(handler: (url: string) => Response | Promise<Response>) {
  return (async (url: string) => handler(url)) as unknown as typeof fetch;
}

function okJson(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("successful fetch stores fresh params", async () => {
  const r = new ParamsRefresher({
    url: "https://example/params.json",
    intervalMs: 1000,
    jitterMs: 0,
    fetchImpl: fakeFetch(() => okJson({ chinesePublicHolidays: ["2026-11-11"] })),
  });
  const loaded = await r.refreshNow();
  assert.equal(loaded.fresh, true);
  assert.deepEqual(loaded.params.chinesePublicHolidays, ["2026-11-11"]);
  assert.ok(loaded.lastFetchedAt);
});

test("failure keeps last-known-good and marks not fresh", async () => {
  let calls = 0;
  const r = new ParamsRefresher({
    url: "https://example/params.json",
    intervalMs: 1000,
    jitterMs: 0,
    fetchImpl: fakeFetch(() => {
      calls++;
      if (calls === 1) return okJson({ chinesePublicHolidays: ["2026-11-11"] });
      throw new Error("network down");
    }),
  });
  const first = await r.refreshNow();
  assert.equal(first.fresh, true);
  const second = await r.refreshNow(); // fails
  assert.equal(second.fresh, false);
  assert.deepEqual(second.params.chinesePublicHolidays, ["2026-11-11"]); // kept
});

test("invalid data falls back to builtin and not fresh", async () => {
  const r = new ParamsRefresher({
    url: "https://example/params.json",
    intervalMs: 1000,
    jitterMs: 0,
    fetchImpl: fakeFetch(() => okJson({ chinesePublicHolidays: ["not-a-date"] })),
  });
  const loaded = await r.refreshNow();
  assert.equal(loaded.fresh, false);
  assert.deepEqual(loaded.params, BUILTIN_PARAMS);
});

test("HTTP error keeps last good", async () => {
  const r = new ParamsRefresher({
    url: "https://example/params.json",
    intervalMs: 1000,
    jitterMs: 0,
    fetchImpl: fakeFetch(() => okJson({}, 500)),
  });
  const loaded = await r.refreshNow();
  assert.equal(loaded.fresh, false);
});
