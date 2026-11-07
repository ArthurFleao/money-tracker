# Deploy

> Local builds work today. Firebase Hosting, emulators and CI deploys are
> completed in **Phase 8** ([PLAN.md §10](../PLAN.md#10-firebase-readiness--deployment-phase-8-details)).

## Local

```bash
pnpm install
pnpm dev            # dev server with HMR on http://localhost:5173
pnpm build          # type-checks (tsc -b) then builds to dist/
pnpm preview        # serves dist/ on http://localhost:4173
```

The build is a static SPA: any static host works as long as unknown paths are
rewritten to `/index.html` (client-side routing).

## Environment matrix

| Variable                      | Local (dexie)     | Demo     | Firebase (Phase 8) |
| ----------------------------- | ----------------- | -------- | ------------------ |
| `VITE_DATA_ADAPTER`           | `dexie` (default) | `memory` | `firebase`         |
| `VITE_FIREBASE_*`             | —                 | —        | required           |
| `VITE_USE_FIREBASE_EMULATORS` | —                 | —        | `true` locally     |

Copy [`.env.example`](../.env.example) to `.env.local` to override values. In
`dexie` mode no variables are needed, so forks run with zero setup.

## CI

`.github/workflows/ci.yml` runs on every PR and on pushes to `main`:
lint → typecheck → unit tests with coverage → build (artifact `dist`) and, in
a parallel job, Playwright e2e (artifacts `playwright-report`,
`test-results`). Node comes from `.nvmrc`; pnpm from `packageManager` in
`package.json`.

## Firebase Hosting (Phase 8, to be written)

`firebase.json` (hosting `public: dist`, SPA rewrite, cache headers for hashed
assets), `.firebaserc` aliases, the Emulator Suite (`pnpm emulators`), and
`deploy.yml` (deploy from `main`, preview channels for PRs).
