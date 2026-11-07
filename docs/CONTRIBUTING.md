# Contributing

Thanks for helping! Read [AGENTS.md](../AGENTS.md) (the short, non-negotiable
rules) and [PLAN.md](../PLAN.md) (scope and roadmap) first — they apply to
humans and AI agents alike.

## Setup

1. Install **Node 24** (`nvm use` reads [`.nvmrc`](../.nvmrc)) and **pnpm 12**
   (`npm i -g pnpm` or `corepack enable`).
2. `pnpm install` — also installs the Git hooks (Husky).
3. `pnpm exec playwright install chromium webkit` — browsers for e2e.
4. Optional but recommended: install [gitleaks](https://github.com/gitleaks/gitleaks)
   so the pre-commit secret scan runs locally.
5. `pnpm dev`.

## Workflow

1. Find the current phase in PLAN.md §13 and pick **one** checklist item.
2. Branch: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
3. Write tests first or alongside (TDD preferred for `src/domain`).
4. Iterate with the smallest command (`pnpm vitest run src/shared/ui`).
5. Before pushing: **`pnpm test:all` must be green.**
6. Update the docs your change touches (README, `docs/*`, JSDoc, CHANGELOG).
7. Tick the item in PLAN.md §13.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), scope = feature
folder, phase tag at the end; header ≤ 100 characters (commitlint enforces it):

```
feat(recurring): clamp monthly rules to last day of month [P5]
fix(wallets): keep archived wallets in net worth history [P3]
docs(testing): explain the zustand reset mock [P0]
```

Hooks run automatically:

- **pre-commit:** lint-staged (ESLint `--fix` + Prettier on staged files) and gitleaks.
- **commit-msg:** commitlint.

## Pull requests

- Small and single-purpose; link the PLAN.md section.
- Fill in the PR template checklist (tests, docs, screenshots for UI in both
  themes and both layouts, a11y, reduced motion, no secrets).
- CI (`CI` and `Secret scan` workflows) must be green.

## Definition of done

Code + unit/component tests + e2e if it is a user flow + docs updated +
lint/typecheck clean + CI green + reviewed.

## Changing the plan

Any deviation from PLAN.md, or any non-obvious choice, needs an ADR in
[`docs/adr/`](./adr/) (copy [`0000-template.md`](./adr/0000-template.md)) and
maintainer approval **before** implementation.

## Code review expectations

Reviewers check: behavior is tested at the right level; money stays in integer
minor units; dates are `YYYY-MM-DD` strings; `today` is injected; layer
boundaries hold; strings are centralized; UI is keyboard- and screen-reader
friendly in both themes; animations respect reduced motion.
