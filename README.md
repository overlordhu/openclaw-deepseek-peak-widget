# OpenClaw DeepSeek Peak/Off-Peak Widget

An **always-visible OpenClaw sidebar widget** that tells the human operator, at a
glance, how much time remains until DeepSeek's API pricing flips between
**off-peak (½ price)** and **peak (2× cost)**.

Install it once, and it stays visible in your OpenClaw sidebar — no setup, no
configuration panel, nothing to remember. Just look at the corner of your screen.

> **Author:** OverLord

---

## At a glance

DeepSeek charges **half price outside peak hours**. Peak hours are:

- **01:00–04:00 UTC** and **06:00–10:00 UTC**
- **Monday–Friday**, excluding Chinese public holidays

Everything else — evenings, nights, weekends, and Chinese public holidays — is
**off-peak (half price)**.

This widget shows you exactly how much cheap (or expensive) time you have left,
right now, in **your own time zone**.

---

## What you see (and what each part means)

```
┌─────────────────────────────────────────┐
│ [🐋] DeepSeek Pricing              ⦿    │  ← whale logo + title, status dot (top-right)
│        Peak / Off-peak status            │  ← subtitle
│─────────────────────────────────────────│  ← separator
│  OFF-PEAK · ½ price         02:14        │  ← status pill + the big countdown
│  until peak pricing (2× cost) → 17:00    │  ← plain-English explanation
│─────────────────────────────────────────│  ← separator
│  model             In·miss   Output      │  ← price table header
│  deepseek-flash    $0.15     $0.60       │  ← green = cheap (off-peak) rate
│                    $0.30     $1.20       │  ← red = expensive (peak) rate
│  deepseek-v4-pro   $0.66     $1.98       │
│                    $1.32     $3.96       │
│ ┌──────────────────────────────────────┐ │
│ │  Happy holidays!                      │ │  ← optional banner (colored, from server)
│ └──────────────────────────────────────┘ │
│  Updated 17:10 · peak = 2× off-peak  [ow]│  ← footer + OneWeb logo (lower-right)
└─────────────────────────────────────────┘
```

### 1. The countdown (the big `HH:MM` number)

This is the whole point of the widget — **how much time you have left** before the
price changes.

- **Green number** → you're currently in **off-peak** (half price). You have this
  much cheap time left.
- **Red number** → you're currently in **peak** (double price). You have this much
  time until it drops back to half price.

The number updates **every minute**, automatically. You never have to do anything.

### 2. The status pill

A small badge that reads either **`OFF-PEAK · ½ price`** (green) or
**`PEAK · 2× cost`** (red). It's the same information as the countdown, stated in
words, for a one-glance answer.

### 3. The price table

Shows the current per-token prices for **both** DeepSeek models:

- **`deepseek-flash`** (the fast/cheap model)
- **`deepseek-v4-pro`** (the powerful model)

Each model has a **green row** (off-peak prices) and a **red row** (peak prices),
so you can see both rates side by side.

> Prices are shown **per 1 million tokens**. They update automatically from the
> parameter file; the values shown here are the built-in defaults if the file
> cannot be reached.

### 4. The status dot (top-right corner)

A tiny colored dot that tells you whether the widget's data is fresh:

- **🔴 Red** → data not yet refreshed (this is also the default when the widget
  first loads).
- **🟢 Green** → the last update succeeded.
- Back to **🔴 Red** → if a later update fails (network hiccup, etc.).

You don't need to do anything with it — it's just a health indicator. In the event
of any network problem, the widget **silently keeps the last good data** and keeps
working with the timing and prices it already has.

### 5. The banner (optional)

From time to time you may see a small colored banner — for example
**"Happy holidays!"** — pushed from the parameter file. It can carry a custom
color and a start/end date. When there's nothing to announce, it simply doesn't
appear.

### 6. The footer

A small line with the last update time and a reminder that **peak = 2× off-peak**,
plus the OneWeb logo in the lower-right corner.

---

## How easy is it to use?

**Very.** After installation the widget appears in your sidebar and works on its
own:

- ✅ **Zero configuration** — no settings, no time-zone picking, no API keys.
- ✅ **Automatic time zone** — times are shown in *your* local time, detected
  automatically from your browser/device.
- ✅ **Self-updating** — the countdown refreshes every minute; prices and holiday
  dates refresh periodically (and fall back gracefully if the server is
  unreachable).
- ✅ **Light & dark** — the widget uses your OpenClaw theme automatically, and the
  logos are transparent so they look correct on both.

You literally just glance at it. That's it.

---

## Installation

1. Enable the **Custom plugin UI** Labs setting (Settings → Labs → Custom plugin UI,
   or `gateway.controlUi.experimental.customPlugins = true`). Required for the
   native sidebar page of a user-installed plugin.
2. Build and install:
   ```bash
   npm install
   npm run build          # tsc + openclaw plugins build
   npx openclaw plugins install . --force
   ```
3. Hard-reload the Control UI browser tab.
4. Click **"DeepSeek Pricing"** in the sidebar.

See [BUILD.md](BUILD.md) for full build/deploy/verify details.

---

## How it works (technical)

- **Native feature plugin** running inside the OpenClaw Gateway process.
- A **schedule engine** computes peak/off-peak boundaries in UTC from the rules
  above (Mon–Fri peak windows, minus Chinese public holidays).
- A **parameter file** (static JSON, hosted at
  `https://openclaw-deepseek-peak-widget.vigpal.hu/params.json`) supplies:
  - the Chinese public-holiday list (date exceptions),
  - the current **price table** (overrides the built-in defaults),
  - an optional **banner** (text + color + date window).
- The file is fetched on startup and then every **6 hours (± 15 min jitter)**, with
  a manual refresh action. **On any failure, the last good file is kept silently.**
- The **widget UI** renders everything in the viewer's local time zone via the
  browser's `Intl` APIs, and updates the countdown every minute.

---

## Project structure

```
deepseek-peak-widget/
├── README.md              ← this file
├── DESIGN.md              ← full design spec (visuals + behaviour decisions)
├── BUILD.md               ← build / install / deploy / verify instructions
├── params-notes.md        ← parameter-file schema + Chinese-holiday methodology
├── params.json            ← the parameter file (holidays + prices + banner)
├── design/
│   ├── assets/
│   │   ├── deepseek-whale.png   ← whale logo (transparent, square)
│   │   └── oneweb-square.png    ← OneWeb wordmark (transparent, square)
│   └── mockup2.html / .png      ← approved visual reference
├── src/
│   ├── index.ts           ← backend: feature plugin + refresh service
│   ├── contract.ts        ← feature contract (status/refresh operations)
│   ├── schedule.ts        ← peak/off-peak schedule engine
│   ├── params.ts          ← parameter-file loader + jittered refresh
│   ├── control-ui.ts      ← native sidebar page (registerNavigation + registerPage)
│   └── control-ui.css     ← widget styling (theme-token driven)
├── openclaw.plugin.json  ← plugin manifest (regenerated by `openclaw plugins build`)
└── package.json          ← package metadata (author OverLord)
```

---

## License

MIT — see [LICENSE](LICENSE). Author: OverLord.
