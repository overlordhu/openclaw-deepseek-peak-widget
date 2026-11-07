# DeepSeek Peak/Off-Peak Widget — Design Spec

Status: **approved interface** (visuals locked). Implementation pending OverLord's "go".

## Purpose

An always-visible OpenClaw sidebar widget (native feature plugin) that shows the
human operator how much time remains until DeepSeek's API pricing flips between
**off-peak (½ price)** and **peak (2× cost)**, so they know their spend window at
a glance.

## Ground truth (verified from official DeepSeek API docs, fetched 2026-11-07)

- **Peak windows (UTC):** `01:00–04:00` and `06:00–10:00`, **Mon–Fri**, excluding
  Chinese public holidays.
- **Off-peak:** everything else — evenings, nights, weekends, and Chinese public
  holidays in full.
- **Off-peak = half of peak** (peak = 2× = 100% surcharge).

## Default prices (baked-in; refreshed from parameter file)

Per 1M tokens. Shown for **both** models, input-cache-miss + output.

| Model | Input (cache miss) off/peak | Output off/peak |
|---|---|---|
| `deepseek-flash` | $0.15 / $0.30 | $0.60 / $1.20 |
| `deepseek-v4-pro` | $0.66 / $1.32 | $1.98 / $3.96 |

*(Cache-hit input lines — $0.003/$0.006 and $0.022/$0.044 — omitted for a cleaner table.)*

## Interface layout (top → bottom)

```
┌─────────────────────────────────────────┐
│ [🐋 whale] DeepSeek Pricing        ⦿    │  ← whale logo (deepseek blue) + title; status dot top-right
│            Peak / Off-peak status         │
│─────────────────────────────────────────│  separator
│  ◉ OFF-PEAK · ½ price     02:14          │  status pill + hero countdown (single color)
│  until peak pricing (2× cost) → 17:00    │  context line (local wall-clock)
│─────────────────────────────────────────│  separator
│  model             In·miss   Output      │
│  deepseek-flash    $0.15     $0.60       │  green = off-peak
│                    $0.30     $1.20       │  red = peak
│  deepseek-v4-pro   $0.66     $1.98       │
│                    $1.32     $3.96       │
│ ┌──────────────────────────────────────┐ │
│ │  Happy holidays!   (#e63946)         │ │  optional banner (hex color)
│ └──────────────────────────────────────┘ │
│  Updated 13:58 · peak = 2× off-peak   (O)│  footer + OneWeb "O" lower-right
└─────────────────────────────────────────┘
```

## Colors

| Element | Color | Meaning |
|---|---|---|
| DeepSeek whale logo | `#4D6BFE` (deepseek blue) | brand |
| Countdown — cheap tier | green (`#16a34a`) | time remaining at ½ price |
| Countdown — expensive tier | red (`#dc2626`) | peak (2×) active |
| Off-peak table figures | green | cheap |
| Peak table figures | red | expensive |
| Status dot (refresh) | **red** default / **green** success | param-file fetch state |
| Banner | `banner.color` hex (fallback `#4D6BFE`) | optional, from param file |
| Card / border / text | theme tokens (`--card`, `--border`, `--text`, `--muted`) | adapts light/dark |

## Behavioural requirements

- **Countdown:** big mono `HH:MM`, **single color** (no blinking/second color).
- **Refresh cadence:** remaining-time `HH:MM` text updates **every minute** (light
  update only; no full re-render). Param file re-fetch is separate (6h ± 15 min).
- **Status dot:** red = not yet (re)fetched (default on load); green = last fetch
  succeeded; returns to red if a later fetch fails. **No text label.**
- **Time zone:** everything displayed in the viewer's browser time zone (via `Intl`),
  computed client-side from UTC timestamps. No settings panel.
- **Lightweight:** no resource-heavy visual effects; minimal re-render on updates.

## Parameter file (static JSON, hosted)

URL: `https://openclaw-deepseek-peak-widget.vigpal.hu/params.json`

```json
{
  "version": 1,
  "generatedAt": "2026-11-07T00:00:00Z",
  "chinesePublicHolidays": ["2027-01-01", "2027-02-06"],
  "prices": {
    "deepseek-flash":  { "inputMiss": { "off": 0.15, "peak": 0.30 }, "output": { "off": 0.60, "peak": 1.20 } },
    "deepseek-v4-pro": { "inputMiss": { "off": 0.66, "peak": 1.32 }, "output": { "off": 1.98, "peak": 3.96 } }
  },
  "banner": { "text": "Happy holidays!", "color": "#e63946", "from": "2027-01-28", "to": "2027-02-05" }
}
```

- `chinesePublicHolidays` — date exceptions subtracted from the Mon–Fri peak schedule.
- `prices` — overrides the built-in defaults; table updates from here on successful fetch.
- `banner` — optional text + hex `color` + `from`/`to` window (all optional fields
  degrade safely).

## Refresh / failure behaviour

- Fetch param file on startup, then every **6h ± 15 min** (uniform jitter), plus a
  manual `operator.write` refresh verb.
- **On any failure** (network/HTTP/parse): silently keep the last-known-good file and
  its timing/banner/prices; status dot → red. A bundled fallback (the defaults above)
  serves first run / offline.
- Banner `color` only colours the banner element; everything else stays theme-driven.

## Assets (pixel-based, transparent — dual theme)

- `design/assets/deepseek-whale.png` — DeepSeek whale, **368×368 transparent PNG**,
  whale in `#4D6BFF` on transparent (works light + dark). Approved.
- `design/assets/oneweb-square.png` — full OneWeb **wordmark** (grey `#9C9D9D` +
  blue `#02A0E2` "O"), **741×741 transparent PNG**, wordmark centered in a square
  canvas with a 5% border (matches the whale's square footprint). Approved.
- `design/mockup2.html` + `mockup2-light.png` / `mockup2-dark.png` — early reference
  (vector logos; superseded by the PNG assets above for final use).

Both marks are plain transparent PNGs (no vectorization), sized as matching squares.

## Decisions log

- Approach: **Option 1 — native feature plugin** (permanent/always-visible).
- Param file format: **JSON** (lighter to parse than CSV).
- Refresh interval: 6h base, OverLord may tune later.
- Banner supports colour (hex); validity window.
- Price table: both models; cache-hit rows omitted (cleaner).
- Whale eye: filled silhouette (accepted at 30px; OverLord may request the eye notch later).
- No "refresh" text label; dot only.
- No blinking/second countdown colour; single colour per state.
- Remaining time refreshes every minute; no full re-render.
- Logos: **pixel-based PNG** (transparent), not vectorized — per OverLord.
- OneWeb mark: **full wordmark** (not just the "O"), square canvas + 5% border.
