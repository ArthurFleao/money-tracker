# Copilot instructions

This repository is governed by two documents. Read both before making changes:

1. [`AGENTS.md`](../AGENTS.md) — the short, non-negotiable rules (testing is
   mandatory, money is integer minor units, dates are `YYYY-MM-DD` strings,
   `today` is injected, layer boundaries, no secrets in git).
2. [`PLAN.md`](../PLAN.md) — scope, domain model, architecture and the
   phase-by-phase roadmap (§13). Find the current phase there and work on one
   checklist item at a time.

Before finishing any task run `pnpm test:all` and make sure it is green, update
the docs you touched, and commit with a Conventional Commit message
(e.g. `feat(wallets): add archive action [P3]`).

If anything in the plan seems wrong or impossible, write an ADR in `docs/adr/`
and ask the maintainer instead of diverging silently.
