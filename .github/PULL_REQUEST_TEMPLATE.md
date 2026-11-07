## What & why

<!-- One concern per PR. Link the PLAN.md section / phase item this implements. -->

Plan reference: PLAN.md §…, Phase …

## How to verify

<!-- Steps a reviewer can follow. -->

## Screenshots

<!-- Required for UI changes: light + dark, desktop + mobile. -->

## Checklist

- [ ] Tests added/updated at the right level (unit / component / e2e) — see docs/TESTING.md
- [ ] `pnpm test:all` is green locally
- [ ] Docs updated (README, docs/\*, JSDoc, CHANGELOG) where behavior changed
- [ ] Accessibility checked (keyboard, focus, labels, axe clean, color not the only signal)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Money is integer minor units; dates are `YYYY-MM-DD` strings; `today` is injected
- [ ] No secrets, real financial data or `.env.local` content committed
- [ ] Deviations from PLAN.md have an ADR in `docs/adr/`
