/**
 * Parameter-file loader and periodic refresher.
 *
 * Fetches a static JSON file holding Chinese public holidays, a price table,
 * and an optional banner. Keeps the last-known-good version on any failure
 * (network, HTTP, or parse error), silently. Ships a built-in fallback so the
 * widget works on first run / fully offline.
 */

import type { BannerConfig, PriceTable } from "./schedule.js";
import { DEFAULT_PRICES } from "./schedule.js";

export interface ParamsFile {
  version?: number;
  generatedAt?: string;
  chinesePublicHolidays?: string[];
  prices?: PriceTable;
  banner?: BannerConfig;
}

/** Built-in fallback used before any successful fetch, or if fetches keep failing. */
export const BUILTIN_PARAMS: ParamsFile = {
  version: 0,
  chinesePublicHolidays: [],
  prices: DEFAULT_PRICES,
};

export interface LoadedParams {
  params: ParamsFile;
  /** true if the current params came from a successful fetch (health dot = green). */
  fresh: boolean;
  /** ISO timestamp of the last successful fetch, or null if never succeeded. */
  lastFetchedAt: string | null;
}

interface RefresherOptions {
  url: string;
  /** Base refresh interval (ms). Actual = this + uniform random jitter. */
  intervalMs: number;
  /** Maximum extra jitter (ms), added to intervalMs. */
  jitterMs: number;
  fetchImpl?: typeof fetch;
  onUpdate?: (loaded: LoadedParams) => void;
}

const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

function validateParams(data: unknown): ParamsFile {
  if (typeof data !== "object" || data === null) {
    throw new Error("params must be an object");
  }
  const obj = data as Record<string, unknown>;

  const holidays: string[] = [];
  if (obj.chinesePublicHolidays !== undefined) {
    if (!Array.isArray(obj.chinesePublicHolidays)) {
      throw new Error("chinesePublicHolidays must be an array");
    }
    for (const h of obj.chinesePublicHolidays) {
      if (typeof h !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(h)) {
        throw new Error(`invalid holiday date: ${String(h)}`);
      }
      holidays.push(h);
    }
  }

  let prices: PriceTable | undefined;
  if (obj.prices !== undefined) {
    // Accept a partial/normalized price table; validate structure lightly.
    if (typeof obj.prices !== "object" || obj.prices === null) {
      throw new Error("prices must be an object");
    }
    prices = obj.prices as PriceTable;
  }

  let banner: BannerConfig | undefined;
  if (obj.banner !== undefined) {
    if (typeof obj.banner !== "object" || obj.banner === null) {
      throw new Error("banner must be an object");
    }
    banner = obj.banner as BannerConfig;
  }

  const out: ParamsFile = {};
  if (typeof obj.version === "number") out.version = obj.version;
  if (typeof obj.generatedAt === "string") out.generatedAt = obj.generatedAt;
  out.chinesePublicHolidays = holidays;
  if (prices) out.prices = prices;
  if (banner) out.banner = banner;
  return out;
}

export class ParamsRefresher {
  private url: string;
  private intervalMs: number;
  private jitterMs: number;
  private fetchImpl: typeof fetch;
  private onUpdate?: (loaded: LoadedParams) => void;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  private current: LoadedParams = {
    params: BUILTIN_PARAMS,
    fresh: false,
    lastFetchedAt: null,
  };

  constructor(opts: RefresherOptions) {
    this.url = opts.url;
    this.intervalMs = opts.intervalMs;
    this.jitterMs = opts.jitterMs;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.onUpdate = opts.onUpdate;
  }

  get snapshot(): LoadedParams {
    return this.current;
  }

  /** Compute next interval with uniform random jitter in [interval, interval+jitter]. */
  private nextDelayMs(): number {
    const jitter = Math.floor(Math.random() * (this.jitterMs + 1));
    return this.intervalMs + jitter;
  }

  async refreshNow(): Promise<LoadedParams> {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);
      let res: Response;
      try {
        res = await this.fetchImpl(this.url, { signal: controller.signal });
      } finally {
        clearTimeout(t);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const data: unknown = JSON.parse(text);
      const params = validateParams(data);
      this.current = {
        params,
        fresh: true,
        lastFetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      // Silently keep last-known-good.
      this.current = { ...this.current, fresh: false };
      void err;
    }
    this.onUpdate?.(this.current);
    return this.current;
  }

  start(): void {
    if (this.timer || this.disposed) return;
    // Initial fetch immediately.
    void this.refreshNow();
    const scheduleNext = () => {
      if (this.disposed) return;
      this.timer = setTimeout(async () => {
        await this.refreshNow();
        scheduleNext();
      }, this.nextDelayMs());
    };
    scheduleNext();
  }

  stop(): void {
    this.disposed = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
