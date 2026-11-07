# DeepSeek Peak/Off-Peak Widget — durable memory

## Facts

- DeepSeek peak hours (UTC): `01:00–04:00` and `06:00–10:00`, Mon–Fri, **excluding
  Chinese public holidays**. Off-peak = everything else (half price). Peak = 2×.
- Brand color: deepseek blue `#4D6BFE` / `#4D6BFF` (whale asset uses `#4D6BFF`).
- OneWeb blue `#02A0E2`; grey letters `#9C9D9D`.
- Default prices (per 1M tokens): flash in-miss $0.15/$0.30, out $0.60/$1.20;
  v4-pro in-miss $0.66/$1.32, out $1.98/$3.96. Cache-hit lines omitted by decision.

## Decisions

- Native feature plugin (Option 1) for permanent/always-visible widget.
- Param file = JSON; 6h ± 15 min refresh; silent last-good on failure.
- Logos pixel-based PNG (transparent), not vectorized — per OverLord.
- OneWeb mark = full wordmark, square canvas + 5% border.
- Countdown single color, updates every minute; no blinking.
- Refresh dot only (no text label).
- Author = OverLord.
