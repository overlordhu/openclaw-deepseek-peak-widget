/**
 * DeepSeek peak/off-peak schedule engine.
 *
 * Rules (verified from official DeepSeek API docs, 2026-11-07):
 *   - Peak windows are 01:00–04:00 and 06:00–10:00 UTC, Monday–Friday,
 *     EXCLUDING Chinese public holidays.
 *   - Off-peak is everything else (including weekends and Chinese public
 *     holidays in full).
 *   - Off-peak rates are half of peak rates (peak = 2x).
 *
 * This module is pure and deterministic: it takes a `now` Date and a set of
 * Chinese-holiday date strings ("YYYY-MM-DD") and returns the current state and
 * the time until the next transition. All boundary math is done in UTC.
 */

export type PricingState = "peak" | "off-peak";

export interface PriceRow {
  inputMiss: { off: number; peak: number };
  output: { off: number; peak: number };
}

export interface PriceTable {
  [model: string]: PriceRow;
}

export interface BannerConfig {
  text?: string;
  color?: string;
  from?: string; // YYYY-MM-DD (inclusive)
  to?: string; // YYYY-MM-DD (inclusive)
}

export interface ScheduleResult {
  state: PricingState;
  /** ISO 8601 UTC timestamp of the next transition (state change). */
  nextChangeAt: string | null;
  /** Whole milliseconds until nextChangeAt (floor); 0 if now. */
  msUntilNextChange: number;
  /** The peak windows that are relevant today (for debugging/labels). */
  label: string;
}

const PEAK_WINDOWS: Array<[number, number]> = [
  [1, 4], // 01:00–04:00 UTC
  [6, 10], // 06:00–10:00 UTC
];

const MS_MINUTE = 60_000;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;

/** Parse "YYYY-MM-DD" into a Date at 00:00 UTC. Throws on invalid input. */
export function parseDateUtc(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`invalid date: ${s}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw new Error(`invalid date: ${s}`);
  }
  return dt;
}

/** YYYY-MM-DD (UTC) of a Date. */
export function dateKeyUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** True if `d` falls on a Chinese public holiday (per the given date keys). */
function isHoliday(d: Date, holidays: ReadonlySet<string>): boolean {
  return holidays.has(dateKeyUtc(d));
}

/** Whether the given instant is inside a defined peak window (before holiday carve-out). */
function inPeakWindow(utc: Date): boolean {
  const day = utc.getUTCDay(); // 0=Sun..6=Sat
  // Weekends are never peak.
  if (day === 0 || day === 6) return false;
  const minutes = utc.getUTCHours() * 60 + utc.getUTCMinutes();
  for (const [startHour, endHour] of PEAK_WINDOWS) {
    if (minutes >= startHour * 60 && minutes < endHour * 60) return true;
  }
  return false;
}

/** Whether the given instant is "peak" after applying the holiday carve-out. */
export function isPeak(utc: Date, holidays: ReadonlySet<string> = new Set()): boolean {
  if (isHoliday(utc, holidays)) return false;
  return inPeakWindow(utc);
}

/**
 * Find the next transition boundary (peak<->off-peak) strictly after `now`.
 * Returns null if no transition exists within the horizon (should not happen
 * given the weekly schedule). This scans hour-by-hour to be correct across
 * holiday and weekend boundaries without complex interval math.
 */
export function nextChangeAt(now: Date, holidays: ReadonlySet<string> = new Set()): Date | null {
  // Scan minute boundaries up to ~14 days ahead (safe horizon; peak rule is weekly).
  const start = new Date(now.getTime() + MS_MINUTE);
  start.setUTCSeconds(0, 0);
  const cur = isPeak(start, holidays);
  for (let i = 0; i < 14 * 24 * 60; i++) {
    const t = new Date(start.getTime() + i * MS_MINUTE);
    if (isPeak(t, holidays) !== cur) return t;
  }
  return null;
}

export function computeSchedule(
  now: Date,
  holidays: ReadonlySet<string> = new Set(),
): ScheduleResult {
  const state: PricingState = isPeak(now, holidays) ? "peak" : "off-peak";
  const next = nextChangeAt(now, holidays);
  const msUntilNextChange = next ? Math.max(0, next.getTime() - now.getTime()) : 0;
  return {
    state,
    nextChangeAt: next ? next.toISOString() : null,
    msUntilNextChange,
    label: state === "peak" ? "PEAK · 2× cost" : "OFF-PEAK · ½ price",
  };
}

/** Default price table (per 1M tokens) — used when the param file is unavailable. */
export const DEFAULT_PRICES: PriceTable = {
  "deepseek-flash": {
    inputMiss: { off: 0.15, peak: 0.3 },
    output: { off: 0.6, peak: 1.2 },
  },
  "deepseek-v4-pro": {
    inputMiss: { off: 0.66, peak: 1.32 },
    output: { off: 1.98, peak: 3.96 },
  },
};

/** Whether a banner (with optional window) is currently active. */
export function bannerIsActive(banner: BannerConfig | undefined, now: Date): boolean {
  if (!banner) return false;
  if (banner.from) {
    const from = parseDateUtc(banner.from);
    if (now.getTime() < from.getTime()) return false;
  }
  if (banner.to) {
    // "to" is inclusive of that full day.
    const to = parseDateUtc(banner.to);
    const toEnd = new Date(to.getTime() + MS_DAY - 1);
    if (now.getTime() > toEnd.getTime()) return false;
  }
  return true;
}
