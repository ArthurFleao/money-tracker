# 0001 — Tech stack and versions

- **Status:** Accepted
- **Date:** 2026-11-07
- **Deciders:** maintainer, implementing agent
- **Phase:** P0
- **Related:** PLAN.md §3 (tech stack), §14 (decisions already made)

## Context

PLAN.md §3 fixes the tools and asks us to use the **latest stable** version of
each at scaffold time and to record the chosen versions here. A few "latest"
versions are incompatible with each other; this ADR records those trade-offs.

## Decision

### Runtime & package manager

| Tool    | Version                          | Notes                                                                                     |
| ------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| Node.js | **24 LTS** (24.22.2 at scaffold) | Pinned in `.nvmrc`, `engines.node >= 24`. Vitest 5 requires Node ≥ 22.12; Node 20 is EOL. |
| pnpm    | **12.18.0**                      | `packageManager` field; lockfile committed.                                               |

### Installed in Phase 0

| Concern               | Package                                                                                                      | Version                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Build                 | vite · @vitejs/plugin-react                                                                                  | 8.3 · 6.2                                      |
| UI                    | react · react-dom                                                                                            | 19.3                                           |
| Language              | typescript                                                                                                   | **6.0** (see below)                            |
| Styling               | tailwindcss · @tailwindcss/vite · prettier-plugin-tailwindcss                                                | 4.3 · 4.3 · 0.8                                |
| Animation             | motion                                                                                                       | 14.10                                          |
| Routing               | react-router                                                                                                 | 8.5 (data router, library mode)                |
| UI state              | zustand                                                                                                      | 5.1                                            |
| Primitives            | @radix-ui/react-dialog · -switch · -tabs · -tooltip · -slot                                                  | 1.3 · 1.4 · 1.2 · 1.4 · 1.5                    |
| Toasts / icons / font | sonner · lucide-react · @fontsource-variable/inter                                                           | 2.0 · 1.70 · 5.3                               |
| Class utils           | clsx · tailwind-merge                                                                                        | 2.1 · 3.7                                      |
| Unit/component tests  | vitest · @vitest/coverage-v8 · jsdom · @testing-library/react · user-event · jest-dom · fake-indexeddb       | 5.1 · 5.1 · 31 · 16.3 · 14.6 · 7.0 · 6.2       |
| E2E                   | @playwright/test · @axe-core/playwright                                                                      | 1.65 · 4.14                                    |
| Lint/format           | eslint · typescript-eslint · eslint-plugin-boundaries · -react-hooks · -jsx-a11y · -react-refresh · prettier | **9.39** · 8.72 · 7.4 · 7.1 · 6.10 · 0.5 · 3.9 |
| Git hooks             | husky · lint-staged · @commitlint/cli                                                                        | 9.1 · 17.6 · 21.2                              |
| Secret scanning       | gitleaks (binary + `gitleaks/gitleaks-action@v3`)                                                            | 8.30                                           |
| CI actions            | actions/checkout · setup-node · upload-artifact · pnpm/action-setup                                          | v7 · v7 · v7 · v6                              |

### Installed in Phase 1

| Concern                | Package    | Version |
| ---------------------- | ---------- | ------- |
| Validation             | zod        | 4.6     |
| Property-based testing | fast-check | 4.10    |

### Added when their phase starts (latest stable at that time; update this ADR)

Dexie (P2), React Hook Form +
@hookform/resolvers (P3–P4), Radix Popover/DropdownMenu (as needed), Nivo
(P6), size-limit (P7), Firebase + @firebase/rules-unit-testing (P8), date-fns
(UI formatting only, if `Intl` is not enough — the domain does not use it, see
[ADR-0002](./0002-dates-as-strings.md)).

### Deliberate holds (not the latest major)

1. **TypeScript 6.0 instead of 7.0.** `typescript-eslint` 8.72 supports
   TypeScript `>=4.8.4 <6.1.0`; type-aware linting (required for `no-explicit-any`,
   `no-floating-promises`, etc.) would break on 7.x.
2. **ESLint 9.39 instead of 10.x.** `eslint-plugin-jsx-a11y` 6.10 declares
   peer support up to ESLint 9, and ESLint 10 removed rule-context APIs older
   plugins rely on. Accessibility linting is a hard requirement (AGENTS.md
   rule 9).
3. **`@types/node` 24** to match the Node LTS line in `.nvmrc`.

Dependabot ignores these majors (`.github/dependabot.yml`). Lift a hold by
upgrading, running `pnpm test:all`, and updating this ADR.

### Implementation choices within the plan

- **Theme state** uses a persisted Zustand store (`useThemeStore`) per PLAN.md
  §5.5; `ThemeProvider` only applies the class to `<html>`.
- **Select** is a styled native `<select>` rather than Radix Select (PLAN.md's
  Radix list does not include Select; native gives the best mobile pickers and
  screen-reader support).
- **Dialog/Sheet/Tooltip animations** are CSS keyframes driven by Radix
  `data-state`, so exit animations work without forcing mounts; Motion is used
  for page transitions and number tweens.
- **Layer boundaries** are enforced with `eslint-plugin-boundaries`
  (`boundaries/dependencies`) and `no-restricted-imports` for `dexie`/`firebase`.

## Alternatives considered

| Option                         | Pros                    | Cons                                      |
| ------------------------------ | ----------------------- | ----------------------------------------- |
| TS 7 + drop type-aware linting | newest compiler, faster | loses the strictest lint rules            |
| ESLint 10 without jsx-a11y     | newest ESLint           | loses a11y linting (non-negotiable)       |
| Stay on Node 20 + Vitest 4     | no machine changes      | Node 20 is EOL; older test runner         |
| npm instead of pnpm            | preinstalled            | PLAN.md prefers pnpm; slower, less strict |

## Consequences

- Contributors need Node 24 and pnpm 12.
- Revisit the TypeScript and ESLint holds when `typescript-eslint` supports TS 7
  and `eslint-plugin-jsx-a11y` supports ESLint 10.
