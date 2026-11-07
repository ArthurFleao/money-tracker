# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Entries are derived from
Conventional Commits.

## [Unreleased]

### Added — Phase 0 (foundation)

- Vite + React 19 + strict TypeScript scaffold with pnpm and the `@/` alias.
- Tooling: ESLint (type-aware, layer boundaries, react-hooks, jsx-a11y), Prettier
  with the Tailwind plugin, Husky, lint-staged, commitlint and a gitleaks
  pre-commit hook.
- Vitest + Testing Library + jsdom + fake-indexeddb with enforced coverage
  thresholds and shared test helpers (`renderWithProviders`, factories,
  `matchMedia` mock, per-test Zustand store reset).
- Tailwind CSS v4 design tokens (semantic colors, wallet palette, radii,
  elevation, type scale, motion keyframes) for light and dark themes; Inter
  variable font; theme toggle (Light / Dark / System) persisted without a
  flash on load.
- Playwright e2e on Chromium, WebKit and Pixel 7 with axe accessibility checks.
- GitHub Actions CI (lint, typecheck, unit + coverage, build, e2e with
  artifacts), gitleaks workflow, Dependabot, issue and PR templates.
- App shell: router with route placeholders, desktop sidebar, mobile top bar and
  bottom tab bar with quick-add, page transitions, route error boundaries,
  document titles and toasts.
- Shared UI v1: Button, Card, Input, Select, Switch, Dialog/Sheet, Tabs,
  Tooltip, Skeleton, EmptyState and AnimatedNumber.
- Documentation: README, architecture, domain (skeleton), design, testing,
  security, deploy, contributing, ADR template and ADR-0001 (tech stack),
  license (MIT), code of conduct and this changelog.
