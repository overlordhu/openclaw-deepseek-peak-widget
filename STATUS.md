# STATUS.md — deepseek-peak-widget

Updated: 2026-11-07 18:20 Europe/Budapest

## State

**LIVE — widget rendering in the Control UI sidebar.**

## Done

- Design spec + README + logo assets (transparent PNGs).
- Standalone git repo (dedicated key, joined remote history).
- Schedule engine (peak windows + Chinese-holiday carve-out) — 15 tests pass.
- Param-file loader with 6h±15min jittered refresh + silent last-good fallback.
- **Final architecture: native feature plugin** (`defineFeaturePlugin` +
  `defineFeatureContract`) with `registerNavigation` + `registerPage` (sidebar
  tab → native page), built via `openclaw plugins build` (content-hash controlUi).
- Widget UI: whale + OneWeb logos (linked to oneweb.hu), labeled h/m countdown,
  status dot, both-model price table, banner, light/dark via theme tokens.
- `params.json` (2026–2029 Chinese holidays + prices + sample banner) deployed to
  `openclaw-deepseek-peak-widget.vigpal.hu` (valid SSL).
- Custom plugin UI lab enabled (`gateway.controlUi.experimental.customPlugins=true`).
- **Installed + activated + rendering** in the live Control UI (OverLord confirmed).

## Key architectural lesson (recorded for future)

- Dashboard widgets need `registerGatewayMethod` + `definePluginEntry`; but the
  `openclaw plugins build` CLI (which produces the loadable content-hash
  `controlUi` bundle) requires `defineFeaturePlugin`/`defineToolPlugin` tool/feature
  metadata. A native **sidebar page** uses `defineFeaturePlugin` + `registerNavigation`
  + `registerPage` + `createFeatureClient` — the fully-supported path.

## Remaining (optional/polish)

- None blocking. Possible follow-ups: refresh the projected 2028/2029 Chinese
  holidays when official calendars publish; banner verification on the live params
  fetch (green dot).

## Notes

- Installed copy lives at `/home/openclaw/.openclaw/extensions/deepseek-peak-widget/`.
- The local `node_modules/openclaw` dev-dependency caused a peer-link conflict the
  installer auto-repaired — keep `openclaw` in devDependencies only.
