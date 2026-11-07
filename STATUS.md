# STATUS.md — deepseek-peak-widget

Updated: 2026-11-07 17:35 Europe/Budapest

## State

**Code complete and locally verified. Blocked on OverLord for live install.**

## Done

- Design spec + README + logo assets (transparent PNGs).
- Standalone git repo (dedicated key, joined remote history).
- Schedule engine (peak windows + Chinese-holiday carve-out) — 15 tests pass.
- Param-file loader with 6h±15min jittered refresh + silent last-good fallback.
- Feature-plugin architecture: `status` (query/operator.read) and `refresh`
  (action/operator.write) operations + widget descriptor + background service.
- Native widget UI: whale + OneWeb logos, labeled `h`/`m` countdown, status dot,
  both-model price table, banner, light/dark via theme tokens.
- `openclaw plugins build` + `validate` → `valid: true`, no errors.
- Backend smoke-tested end-to-end (correct payload, services/actions/descriptor).
- `params.json` (2026 Chinese holidays + prices + sample banner) + methodology.

## Blocked on OverLord

1. **Live install** — needs `gateway.controlUi.experimental.customPlugins` Labs
   setting enabled + connected Control UI to verify rendering.
2. **Deploy params.json** to `openclaw-deepseek-peak-widget.vigpal.hu` (hosting
   credentials).
3. **Push to GitHub** (`git@github.com:overlordhu/openclaw-deepseek-peak-widget.git`)
   — awaiting OverLord's go (I never push without a command).

## Next steps (when OverLord is ready)

1. Enable Custom plugin UI lab; `openclaw plugins install .`; reload; verify render.
2. Deploy `params.json`; confirm the dot turns green on first successful fetch.
3. Test failure path (dot → red while offline, keeps last good).
4. Commit + push.

## Notes

- Feature plugins expose operations as **session actions**; the manifest's
  `dashboard.dataBindings[].method` / `actionVerbs[].method` use
  `<pluginId>.<operation>` naming (`deepseek-peak-widget.status` / `.refresh`).
