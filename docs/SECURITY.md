# Security

> Expanded from [PLAN.md §9](../PLAN.md#9-security--secrets). The Firebase
> sections are completed in Phase 8.

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's private
**Security → Report a vulnerability** form on this repository. We aim to
acknowledge reports within 3 business days and to ship a fix or mitigation as
quickly as the severity requires. Please give us a reasonable window before any
public disclosure.

## What is (and is not) secret

- **Secret:** service-account JSON, Admin SDK credentials, CI deploy tokens,
  any personal financial data. These **never** enter the repository or the
  client bundle — CI reads them from GitHub Secrets only.
- **Not secret:** Firebase _web_ config (`apiKey`, `authDomain`,
  `projectId`, …). It ships to every browser by design. Protection comes from
  Firestore Security Rules, App Check, authorized domains and API-key HTTP
  referrer restrictions (Phase 8). We still keep it in env vars so forks use
  their own project.
- Anything read via `import.meta.env.VITE_*` is **public** once built.

## Repository hygiene (active since Phase 0)

- All configuration via `import.meta.env.VITE_*`. Every variable is listed with
  a dummy value in [`.env.example`](../.env.example).
- `.env`, `.env.local` and `.env.*.local` are git-ignored; `.gitignore` was
  committed before any env file existed.
- **gitleaks** runs:
  - as a **pre-commit hook** on staged changes (`.husky/pre-commit`). If the
    binary is missing the hook warns and continues — install it
    (`scoop install gitleaks`, `brew install gitleaks`, or a release binary
    from <https://github.com/gitleaks/gitleaks>) to get local protection;
  - as a **GitHub Action** on every push to `main`, every PR, and weekly
    (`.github/workflows/gitleaks.yml`). Organization-owned repos need a free
    `GITLEAKS_LICENSE` secret.
- **Dependabot** (`.github/dependabot.yml`) opens weekly update PRs for npm and
  GitHub Actions. Majors that are deliberately held back are listed there with
  a pointer to ADR-0001.
- Demo/seed data is generated and fictional. Never commit real financial data,
  screenshots with real amounts, or exports.

## GitHub settings to enable (manual)

These cannot be configured from code; a maintainer should enable them:

- [ ] Secret scanning **and push protection**
- [ ] Private vulnerability reporting
- [ ] Dependabot alerts and security updates
- [ ] Branch protection on `main`: require PRs, require the `CI` and
      `Secret scan` checks, disallow force pushes

## Data privacy

- **Local mode:** all data stays in the browser's IndexedDB. Export and reset
  are always available (Phase 2/7).
- **Cloud mode (Phase 8):** data is scoped per household and protected by
  tested Firestore rules; deleting a household deletes its data.

## Phase 8 additions (to be written)

Firestore Security Rules and their tests, App Check setup, authorized domains,
API-key restrictions, and the list of GitHub Secrets used by `deploy.yml`.
