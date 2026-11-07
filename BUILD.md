# Build & Deploy — DeepSeek Peak/Off-Peak Widget

How to rebuild, install, and update the plugin. Author: OverLord.

## Prerequisites

- OpenClaw 2026.11.x (matches the `peerDependencies`/`build.openclawVersion`).
- Node 24.16+ / 26.1+.
- The **Custom plugin UI** lab enabled:
  `gateway.controlUi.experimental.customPlugins = true` (via `openclaw` tool → config.set).

## Build

```bash
cd projects/deepseek-peak-widget
npm install          # installs devDependencies (openclaw, typescript, esbuild) + typebox
npm run build        # = tsc + openclaw plugins build (generates content-hash controlUi)
```

`openclaw plugins build` regenerates `openclaw.plugin.json` (controlUi.entry/styles
with content-hash paths) and `package.json`. These are source-controlled.

## Test

```bash
npm test             # node --test dist/  → 15 tests (schedule + params)
```

## Install / update (into a running Gateway)

```bash
npx openclaw plugins install . --force
```

Notes:
- `--force` is required because a local-path install is outside ClawHub trust.
- The installer may print a `memory-core-index ... stop timed out` drain warning if
  a local `node_modules/openclaw` is present; it is auto-repaired and the plugin
  still applies. Prefer running from a clean install (unset local openclaw).

## Deploy / update the parameter file

The widget reads `https://openclaw-deepseek-peak-widget.vigpal.hu/params.json`.

1. Edit `projects/deepseek-peak-widget/params.json`.
2. Upload it to the web root served by that domain (content-type `application/json`).
3. The widget refetches every 6h (±15 min) and silently keeps the last-good file on
   failure, so updates propagate on the next successful fetch.

`params-notes.md` documents the field schema and the Chinese-holiday methodology.

## Git

```bash
git add -A
git commit -m "deepseek-peak-widget: <summary>"
git push origin main
```

Remote uses the dedicated key via `core.sshCommand`:
`ssh -i /home/openclaw/.ssh/onewebai-github -o IdentitiesOnly=yes`.

## Verify

After install: hard-reload the Control UI browser tab; click **"DeepSeek Pricing"**
in the sidebar. The page shows the whale logo, status pill, `Nh Nm` countdown, both
models' price table, OneWeb footer, and a red/green refresh dot.
