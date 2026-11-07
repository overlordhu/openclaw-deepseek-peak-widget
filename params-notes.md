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
only **weekday** public-holiday dates need to be listed. Days inside a holiday
"rest period" that fall on a weekend are already handled by the weekend rule.

The 2026 list below was derived from the official State Council holiday calendar
(published Nov 4, 2025), keeping only Mon–Fri holiday dates:

- New Year's Day: Jan 1 (Thu), Jan 2 (Fri)
- Spring Festival: Feb 16–20 (Mon–Fri), Feb 23 (Mon)
- Qingming: Apr 6 (Mon)
- Labour Day: May 1 (Fri), May 4 (Mon), May 5 (Tue)
- Dragon Boat: Jun 19 (Fri)
- Mid-Autumn: Sep 25 (Fri)
- National Day: Oct 1 (Thu), Oct 2 (Fri), Oct 5 (Mon), Oct 6 (Tue)

## Maintenance

Update this file when:
1. The State Council announces a new year's holiday calendar (usually Nov/Dec).
2. DeepSeek changes its price table.
3. A banner should be shown (set `banner` with the desired window).

The widget re-fetches every 6h (±15 min) and silently keeps the last-good file on
any failure, so updates propagate automatically on the next successful fetch.
