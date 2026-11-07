import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { ParamsRefresher } from "./params.js";
import {
  computeSchedule,
  bannerIsActive,
  DEFAULT_PRICES,
  type PriceTable,
  type PricingState,
} from "./schedule.js";

const PLUGIN_ID = "deepseek-peak-widget";
const METHOD_STATUS = `${PLUGIN_ID}.status`;
const METHOD_REFRESH = `${PLUGIN_ID}.refresh`;

const DEFAULT_PARAMS_URL = "https://openclaw-deepseek-peak-widget.vigpal.hu/params.json";
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
const REFRESH_JITTER_MS = 15 * 60 * 1000; // ±15 min

export interface StatusPayload {
  state: PricingState;
  label: string;
  nextChangeAt: string | null;
  msUntilNextChange: number;
  prices: PriceTable;
  banner: { text: string; color: string | null } | null;
  fresh: boolean;
  lastFetchedAt: string | null;
  now: string;
}

function buildStatus(paramsUrl: string, refresher: ParamsRefresher, now: Date): StatusPayload {
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

export default definePluginEntry({
  id: PLUGIN_ID,
  name: "DeepSeek Peak/Off-Peak Widget",
  description:
    "Always-visible sidebar widget showing time remaining until DeepSeek pricing flips between off-peak (half price) and peak (2x cost).",

  register(api) {
    const paramsUrl =
      (api.pluginConfig?.paramsUrl as string | undefined) ?? DEFAULT_PARAMS_URL;

    const refresher = new ParamsRefresher({
      url: paramsUrl,
      intervalMs: REFRESH_INTERVAL_MS,
      jitterMs: REFRESH_JITTER_MS,
    });

    // Read-only status query (operator.read).
    api.registerGatewayMethod(
      METHOD_STATUS,
      async ({ respond }) => {
        const payload = buildStatus(paramsUrl, refresher, new Date());
        respond(true, payload, undefined);
      },
      { scope: "operator.read" },
    );

    // Refresh action (operator.write) — re-fetch param file now.
    api.registerGatewayMethod(
      METHOD_REFRESH,
      async ({ respond }) => {
        const loaded = await refresher.refreshNow();
        const payload = buildStatus(paramsUrl, refresher, new Date());
        respond(true, { ...payload, fresh: loaded.fresh }, undefined);
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

    // Control UI widget descriptor (native "widget" surface).
    api.session.controls.registerControlUiDescriptor({
      surface: "widget",
      id: "deepseek-peak-widget",
      label: "DeepSeek Pricing",
      description: "Time until DeepSeek's next peak/off-peak pricing change.",
      requiredScopes: ["operator.read"],
    });
  },
});
