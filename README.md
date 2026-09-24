# The Test Report

Portfolio site for [avanegas.com](https://avanegas.com), built as a QA test report: identity, experience, skills, and contact are test cases with pass/warn/fail status. The live quality section (§ 04) is fed by CI on every deploy.

Implementation follows [`PLAN.md`](./PLAN.md). Design tokens, mockups, sample content, and the CI contract live in [`docs/handoff/`](./docs/handoff/).

## Prerequisites

- Node.js 22 (see [`.nvmrc`](./.nvmrc); minimum v22.12.0)
- npm

```bash
nvm install && nvm use
npm install
```

## Scripts

| Script                 | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | Start the Astro dev server (port 4321)                             |
| `npm run build`        | Type-check with `astro check`, then build static output to `dist/` |
| `npm run preview`      | Serve the production build locally                                 |
| `npm run lint`         | Node, ESLint, Prettier, `astro check`, glyph and content guards    |
| `npm run lint:fix`     | Auto-fix ESLint issues                                             |
| `npm run format`       | Format all files with Prettier                                     |
| `npm run format:check` | Verify formatting without writing                                  |
| `npm run test`         | Playwright e2e (3 browsers) + axe a11y                             |
| `npm run test:e2e`     | Playwright e2e only                                                |
| `npm run test:a11y`    | axe accessibility scans only                                       |

## Editing content

Content lives under `src/content/` as Astro collections:

- `src/content/site.json` — hero, metrics, tools, sign-off, contact
- `src/content/suites/*.json` — one file per employer (sorted by `order`)

Reference mockups and the original handoff JSON remain in `docs/handoff/`.

The quality report is **not** content — CI writes `reports/quality-report.json` at build time via the `QUALITY_REPORT` env var. In local dev, a sample file is used when that var is unset.

See [`PLAN.md` §4](./PLAN.md#4-content-model) for schemas, computed values, and launch guards.

## CI overview

A single GitHub Actions workflow (`.github/workflows/quality.yml`, added in M4) orchestrates the full pipeline; Vercel only hosts prebuilt artifacts.

**Triggers:** pull requests, pushes to `main`, weekly schedule (Mon 13:00 UTC), and manual dispatch.

**Pipeline stages:**

1. **Setup** — checkout, fetch run history from the `quality-history` branch
2. **Install** — `npm ci`
3. **Lint** — ESLint, Prettier, `astro check`, glyph and content guards
4. **Build A** — static build using the currently deployed quality report
5. **Serve A** — background static server for test runners
6. **Playwright** — e2e across Chromium, Firefox, and WebKit
7. **axe** — accessibility scans (WCAG 2.2 AA)
8. **Lighthouse** — mobile performance, 3 runs per category
9. **Collect** — assemble `reports/quality-report.json`, validate schema, evaluate gates
10. **Build B** — rebuild with the new report (equivalence check vs Build A)
11. **Deploy** — `vercel deploy --prebuilt --prod` on `main`; preview on PRs
12. **Record** — push updated history to the `quality-history` branch

**Gates:** lint/type checks must pass; Playwright and axe must be clean; Lighthouse medians must be ≥ 95 in all categories; Build A and Build B must match outside § 04. Pipeline duration over 180s warns but still ships.

Full details: [`PLAN.md` §5](./PLAN.md#5-cicd-the-live-quality-report) and [`docs/handoff/ci/`](./docs/handoff/ci/).

## Environment

| Variable           | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `SITE_URL`         | Canonical site URL (defaults to `https://avanegas.com`)       |
| `BUILD_TIME`       | ISO timestamp for version/report ID (set in CI)               |
| `QUALITY_REPORT`   | Path to the quality report JSON for § 04                      |
| `DEPLOY_ENV`       | `production` in CI deploy builds                              |
| `STRICT_CONTENT=1` | Fail content guard on placeholders/drafts (production builds) |

## Repo layout

```
docs/handoff/     Design handoff (mockups, tokens, CI contract)
public/           Static assets (résumé PDF, favicon, robots.txt)
scripts/          Node utilities and CI helpers
src/              Astro pages, components, content, and styles
PLAN.md           Approved implementation plan
```
