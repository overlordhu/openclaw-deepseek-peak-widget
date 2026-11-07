import { defineFeaturePlugin } from "openclaw/plugin-sdk/feature-plugin";
import { contract } from "./contract.js";
import { ParamsRefresher } from "./params.js";
import {
  computeSchedule,
  bannerIsActive,
  DEFAULT_PRICES,
  type PriceTable,
} from "./schedule.js";

const DEFAULT_PARAMS_URL = "https://openclaw-deepseek-peak-widget.vigpal.hu/params.json";
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
const REFRESH_JITTER_MS = 15 * 60 * 1000; // ±15 min

export default defineFeaturePlugin({
  contract,
  name: "DeepSeek Peak/Off-Peak Widget",
  description: "Always-visible sidebar widget showing DeepSeek peak/off-peak pricing.",

  setup(api) {
    const refresher = new ParamsRefresher({
      url: DEFAULT_PARAMS_URL,
      intervalMs: REFRESH_INTERVAL_MS,
      jitterMs: REFRESH_JITTER_MS,
    });

    function buildStatus(now: Date) {
      const loaded = refresher.snapshot;
      const holidays = new Set(loaded.params.chinesePublicHolidays ?? []);
      const schedule = computeSchedule(now, holidays);
      const prices: PriceTable = loaded.params.prices ?? DEFAULT_PRICES;
      const banner = loaded.params.banner;
      const activeBanner = bannerIsActive(banner, now)
        ? { text: banner?.text ?? "", color: banner?.color ?? null }
        : null;

      return {
        state: schedule.state,
        label: schedule.label,
        nextChangeAt: schedule.nextChangeAt,
        msUntilNextChange: schedule.msUntilNextChange,
        prices,
        banner: activeBanner,
        fresh: loaded.fresh,
        lastFetchedAt: loaded.lastFetchedAt,
        now: now.toISOString(),
      };
    }

    // Background refresh service (start/stop with plugin lifecycle).
    api.registerService({
      id: "deepseek-peak-widget-refresh",
      start() {
        refresher.start();
      },
      stop() {
        refresher.stop();
      },
    });

    return {
      status() {
        return buildStatus(new Date());
      },
      async refresh() {
        await refresher.refreshNow();
        return buildStatus(new Date());
      },
    };
  },
});
