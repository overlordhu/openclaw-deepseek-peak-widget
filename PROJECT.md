# PROJECT.md — deepseek-peak-widget

## Purpose

Build and ship a permanent, always-visible **OpenClaw sidebar widget** (native
feature plugin) that shows the human operator how much time remains until
DeepSeek's API pricing flips between off-peak (½ price) and peak (2× cost).

## Scope

- Native OpenClaw feature plugin (`registerWidget` + `registerControlUiDescriptor`)
  with a persistent sidebar presence.
- Backend schedule engine (UTC peak/off-peak computation, minus Chinese public
  holidays).
- Parameter file (static JSON) hosted at
  `https://openclaw-deepseek-peak-widget.vigpal.hu/params.json` — Chinese holidays,
  price table overrides, optional banner. Fetched with jitter; silent last-good
  fallback on failure.
- Pixel-based transparent logo assets (DeepSeek whale + OneWeb wordmark).
- README (author OverLord) and design spec.

## OverLord's directives

<!-- observed: 2026-11-07 | status: active -->
- **Option 1** architecture: native feature plugin (permanent/always-visible).
- Parameter file: static JSON (lighter than CSV), computed/hosted; app refreshes
  periodically with **±15 min jitter**; on failure silently keeps last-known-good.
- Parameter file domain: `openclaw-deepseek-peak-widget.vigpal.hu`.
- Prices are a downloadable/refreshable parameter; current values are defaults.
- Banner supports hex color + date window.
- Countdown: single color (green=cheap, red=expensive), no blinking/second color;
  refresh remaining time every minute (light update only).
- Refresh status dot: red default, green on success, back to red on failure; no
  text label.
- DeepSeek logo = stylized whale (deepseek blue); OneWeb "O"/wordmark at lower-right
  (square canvas, 5% border, matching the whale).
- Both models shown in the price table; cache-hit rows omitted.
- Logos: **pixel-based PNG** (transparent), not vectorized.
- Plugin author: **OverLord**.
- Git remote: `git@github.com:overlordhu/openclaw-deepseek-peak-widget.git`, SSH key
  `/home/openclaw/.ssh/onewebai-github`.

## Layout

```
PROJECT.md          this charter
STATUS.md           current state (update every run)
MEMORY.md           durable facts & decisions
DESIGN.md           full design spec (visuals + behaviour)
README.md           user-facing docs (author OverLord)
DESIGN.md           approved interface + data spec
memory/             daily logs
design/assets/      logo PNGs (transparent, square)
src/                plugin source (build phase)
openclaw.plugin.json / package.json   (build phase)
```

## Relations

- None yet. (Tooling/oversight shared with my overseer workspaces only in the
  sense that I author it; it is a standalone git repo and product.)

## Opening

Opened 2026-11-07 on OverLord's command ("go" after design sign-off).
