import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPeak,
  computeSchedule,
  nextChangeAt,
  bannerIsActive,
  parseDateUtc,
} from "./schedule.js";

function utc(y: number, mo: number, d: number, h = 0, mi = 0): Date {
  return new Date(Date.UTC(y, mo - 1, d, h, mi));
}

test("weekday peak windows are peak", () => {
  // Wed 2026-11-11 is a Wednesday. 02:00 UTC is in 01:00–04:00.
  assert.equal(isPeak(utc(2026, 11, 11, 2, 0)), true);
  // 07:30 UTC is in 06:00–10:00.
  assert.equal(isPeak(utc(2026, 11, 11, 7, 30)), true);
});

test("weekday off-peak times are off-peak", () => {
  // 12:00 UTC (noon) is off-peak on a Wednesday.
  assert.equal(isPeak(utc(2026, 11, 11, 12, 0)), false);
  // 23:00 UTC is off-peak.
  assert.equal(isPeak(utc(2026, 11, 11, 23, 0)), false);
});

test("weekends are off-peak all day", () => {
  // Sat 2026-11-14 and Sun 2026-11-15.
  assert.equal(isPeak(utc(2026, 11, 14, 2, 0)), false);
  assert.equal(isPeak(utc(2026, 11, 14, 8, 0)), false);
  assert.equal(isPeak(utc(2026, 11, 15, 6, 30)), false);
});

test("boundaries are respected (exclusive end)", () => {
  // 04:00 exactly is off-peak (window is [1,4) and [6,10)).
  assert.equal(isPeak(utc(2026, 11, 11, 4, 0)), false);
  // 01:00 exactly is peak (inclusive start).
  assert.equal(isPeak(utc(2026, 11, 11, 1, 0)), true);
  // 10:00 exactly is off-peak.
  assert.equal(isPeak(utc(2026, 11, 11, 10, 0)), false);
});

test("Chinese public holidays override peak to off-peak", () => {
  const holidays = new Set(["2026-11-11"]);
  assert.equal(isPeak(utc(2026, 11, 11, 2, 0), holidays), false);
  // Same holiday, a time that would normally be off-peak stays off-peak.
  assert.equal(isPeak(utc(2026, 11, 11, 12, 0), holidays), false);
});

test("computeSchedule reports state and a future next change", () => {
  const now = utc(2026, 11, 11, 2, 30); // peak (Wed 02:30)
  const r = computeSchedule(now);
  assert.equal(r.state, "peak");
  assert.ok(r.nextChangeAt, "next change should exist");
  assert.ok(r.msUntilNextChange > 0);
  // Next change from 02:30 peak should be at 04:00 (end of first window).
  const next = new Date(r.nextChangeAt!);
  assert.equal(next.toISOString(), utc(2026, 11, 11, 4, 0).toISOString());
});

test("computeSchedule from off-peak at noon points to next peak 06:00", () => {
  const now = utc(2026, 11, 11, 12, 0); // off-peak noon
  const r = computeSchedule(now);
  assert.equal(r.state, "off-peak");
  // Next transition: next peak starts next day 01:00 (Thu 2026-11-12).
  const next = new Date(r.nextChangeAt!);
  assert.equal(next.toISOString(), utc(2026, 11, 12, 1, 0).toISOString());
});

test("nextChangeAt from before first window points into that window", () => {
  const now = utc(2026, 11, 11, 0, 30); // off-peak, just before 01:00
  const next = nextChangeAt(now);
  assert.ok(next);
  assert.equal(next!.toISOString(), utc(2026, 11, 11, 1, 0).toISOString());
});

test("banner is active within window and inactive outside", () => {
  const banner = { text: "Happy holidays!", from: "2026-11-01", to: "2026-11-30" };
  assert.equal(bannerIsActive(banner, utc(2026, 11, 15, 12, 0)), true);
  assert.equal(bannerIsActive(banner, utc(2026, 10, 31, 12, 0)), false);
  assert.equal(bannerIsActive(banner, utc(2026, 12, 1, 0, 0)), false);
});

test("parseDateUtc validates", () => {
  assert.equal(parseDateUtc("2026-11-07").getTime(), utc(2026, 11, 7).getTime());
  assert.throws(() => parseDateUtc("bad"));
  assert.throws(() => parseDateUtc("2026-02-30"));
});
