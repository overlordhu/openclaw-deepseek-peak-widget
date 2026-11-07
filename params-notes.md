# Parameter file — maintenance notes

`params.json` is the static, server-hosted parameter file for the widget. Hosted
at `https://openclaw-deepseek-peak-widget.vigpal.hu/params.json`.

## Fields

- `version` — bump on structural changes (informational).
- `generatedAt` — ISO timestamp of when the file was produced.
- `chinesePublicHolidays` — array of `YYYY-MM-DD` dates (UTC) that are Chinese
  **public holidays**. These are subtracted from the Monday–Friday peak schedule.
- `prices` — price table (per 1M tokens). Overrides the built-in defaults.
- `banner` — optional `{ text, color, from, to }`. `color` is a hex string;
  `from`/`to` are `YYYY-MM-DD` (inclusive) window bounds.

## Methodology for `chinesePublicHolidays`

The schedule engine already treats **weekends (Sat–Sun) as always off-peak**, so
only **weekday** public-holiday dates need to be listed — the weekdays that fall
inside each official holiday rest period. The list runs **2026–2029**.

Rest-period date sources and their accuracy status:

- **2026** — official State Council calendar (published 2025-11-04).
- **2027** — official State Council calendar (published ~Nov 2026).
- **2028** — expected/projected (State Council not yet published; lunar-derived).
- **2029** — projected (lunar-derived; State Council not yet published).

> Years marked "projected" may shift by ±1 day when the State Council makes the
> official make-up-workday adjustments. Re-verify each year when the official
> calendar is published (usually Nov/Dec of the preceding year) and update this
> file.

Per-year weekday count: 2026 = 19, 2027 = 18, 2028 = 18, 2029 = 20 (75 total).

## Maintenance

Update this file when:
1. The State Council announces a new year's holiday calendar (usually Nov/Dec).
2. DeepSeek changes its price table.
3. A banner should be shown (set `banner` with the desired window).

The widget re-fetches every 6h (±15 min) and silently keeps the last-good file on
any failure, so updates propagate automatically on the next successful fetch.
