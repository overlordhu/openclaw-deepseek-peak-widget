import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { ParamsRefresher } from "./params.js";
import {
  computeSchedule,
  bannerIsActive,
  DEFAULT_PRICES,
  type PriceTable,
} from "./schedule.js";

const PLUGIN_ID = "deepseek-peak-widget";
const METHOD_STATUS = `${PLUGIN_ID}.status`;
const METHOD_REFRESH = `${PLUGIN_ID}.refresh`;

const DEFAULT_PARAMS_URL = "https://openclaw-deepseek-peak-widget.vigpal.hu/params.json";
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
const REFRESH_JITTER_MS = 15 * 60 * 1000; // ±15 min

export default definePluginEntry({
  id: PLUGIN_ID,
  name: "DeepSeek Peak/Off-Peak Widget",
  description:
    "Always-visible sidebar widget showing time remaining until DeepSeek pricing flips between off-peak (half price) and peak (2x cost).",

  register(api) {
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

    // Read-only status query (operator.read).
    api.registerGatewayMethod(
      METHOD_STATUS,
      async (request) => {
        try {
          request.respond(true, buildStatus(new Date()), undefined);
        } catch (error) {
          request.respond(false, undefined, {
            code: "UNAVAILABLE",
            message: String(error),
            details: {},
          });
        }
      },
      { scope: "operator.read" },
    );

    // Refresh action (operator.write) — re-fetch param file now.
    api.registerGatewayMethod(
      METHOD_REFRESH,
      async (request) => {
        try {
          await refresher.refreshNow();
          request.respond(true, buildStatus(new Date()), undefined);
        } catch (error) {
          request.respond(false, undefined, {
            code: "UNAVAILABLE",
            message: String(error),
            details: {},
          });
        }
      },
      { scope: "operator.write" },
    );

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
  },
});
