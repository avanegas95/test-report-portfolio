# Implementation Plan: "The Test Report" (avanegas.com)

**Status:** **Final. Approved by Anderson on 2026-09-24.** Ready for an implementing agent.
**Inputs:** `test-report-handoff/` (README brief, 4 mockups, tokens, content, CI contract) and the live site repo `../avanegas95.github.io` (a source for tooling and assets only).

> **For the implementing agent:** read §0 (how to work) first, then the handoff `README.md`, then this plan. When this plan and the handoff README disagree, **this plan wins**, because it records Anderson's decisions (§9). Don't reopen anything listed in §9.

---

## 0. How to work (implementing agent)

- Build **one milestone at a time** (§7). Each milestone ends with its exit criteria met, a commit, and a short summary for Anderson. Don't start the next milestone until Anderson says go.
- **Anderson-only actions** are marked 🔑 and listed in §8. These are creating the GitHub repo, the Vercel project, the secrets and branch protection, and changing DNS. Don't create accounts, projects or tokens, and don't change DNS or settings on the old repo. Stop and ask Anderson instead.
- Treat the `.dc.html` mockups as reference only: read exact values and copy from them, but don't port `<x-dc>`, `<helmet>`, `support.js` or `data-dc-script`, and don't copy the inline styles.
- Where the **mobile mockups** differ from the desktop one in copy or order, **the desktop version wins** (§9 D12). Mobile changes only layout.
- Never commit fake CI numbers to a production path. The sample report is for dev only (§3.4).
- If you hit something this plan doesn't cover and it isn't an obvious implementation detail, ask. Don't guess.

---

## 1. Repo decision and assessment

**Repo:** build in **this repo** (`test-report-portfolio`). It's a fresh git repo with no commits and no remote. Anderson will rename the repo and may change the site name later, so nothing may hard-code the repo name or domain (§1.3).

### 1.1 What's in this folder now
| Path | Action |
|---|---|
| `index.html`, `styles.css`, `report.js` | **Delete in M0.** An earlier prototype of the concept; the handoff supersedes it |
| `README.md` | **Replace** with a project README: what it is, scripts, content editing, the CI overview |
| `.gitignore` | **Extend:** `node_modules/`, `dist/`, `.astro/`, `.vercel/`, `reports/`, `.quality/`, `test-results/`, `playwright-report/`, `.lighthouseci/` |
| `test-report-handoff/` | **Move** to `docs/handoff/`, verbatim |
| `PLAN.md` | Keep (this file) |

### 1.2 What to port from `../avanegas95.github.io` (copy; don't modify that repo)
| From the old repo | Use |
|---|---|
| `eslint.config.js`, `.prettierrc`, `.prettierignore`, `tsconfig.json`, `.nvmrc` (22), `.gitattributes`, `scripts/check-node.mjs` | Tooling baseline. Adjust the ESLint config for `.tsx` / React |
| `package.json` scripts and dev-deps (ESLint 9, `eslint-plugin-astro`, `typescript-eslint`, Prettier + `prettier-plugin-astro`, `@astrojs/check`) | Starting point for `package.json` |
| `public/Anderson_Vanegas_Resume.pdf` | Target of "Download report (PDF)" and "Résumé (PDF)" (§9 D4) |
| Link URLs in `src/data/social-links.ts` | Contact values (§9 D3) |

**Don't port:** `tailwind.config.mjs` (a v3 leftover), `postcss.config.mjs`, the Google Fonts / Montserrat setup, the viewport meta with `maximum-scale=1, user-scalable=0` (blocks zoom, fails WCAG 1.4.4), the blog, the Projects section, or the GitHub Pages workflow.

The old repo keeps serving avanegas.com through GitHub Pages until cutover (M6). Only Anderson touches it.

### 1.3 Repo name and domain must not be hard-coded
- `astro.config.mjs` uses `site: process.env.SITE_URL ?? 'https://avanegas.com'`. Canonical URLs, OG URLs, the sitemap and JSON-LD all come from it.
- The "View all in GitHub Actions →" link and per-run links are built in CI from `GITHUB_SERVER_URL` and `GITHUB_REPOSITORY`, and stored in the report (`actionsUrl`, `runs[].url`). The page never contains a hard-coded repo path.

---

## 2. Architecture

### 2.1 Stack
| Concern | Choice | Notes |
|---|---|---|
| Framework | Astro 6.x (≥ 6.3), `output: "static"` | One page plus a 404 |
| Islands | React 19 via `@astrojs/react` | Only two: `TestCaseRow` (disclosure) and `MobileMenu` |
| Styling | Tailwind v4 via `@tailwindcss/vite`, CSS-first `@theme` | Seeded from `docs/handoff/theme/tailwind-theme.css` plus a type scale |
| Fonts | `@fontsource/ibm-plex-sans` (400/500/600/700) and `@fontsource/ibm-plex-mono` (400/500/600), self-hosted, latin subset | Preload only Sans 600 and Mono 500. `font-display: swap` |
| Content | Astro content layer (`file()` / `glob()` loaders) + Zod | §4 |
| Tests | Playwright (Chromium, Firefox, WebKit) + `@axe-core/playwright` | §5.7 |
| Performance | Lighthouse CI (`@lhci/cli`), mobile, 3 runs | §5 |
| OG image | `satori` + `@resvg/resvg-js` at build time | §6 |
| Hosting | Vercel, **personal Hobby account**; prebuilt deploys from GitHub Actions; Vercel Git auto-deploy disabled | §5.1 |
| Package manager | npm, Node 22 (`.nvmrc`) | |

**Glyph coverage:** the copy uses `→` (U+2192), `−` (U+2212), `▍` (U+258D), `§`, `—`, `’`, `…` and `✓`. The latin subset lacks `→` and `▍`. Render arrows, checkmarks and the terminal cursor as **inline SVG / CSS**, not font glyphs. Add `scripts/check-glyphs.mjs` (run in Lint), which fails if content JSON contains a character outside the subset's `unicode-range`, so future copy can't silently fall back to a system font.

### 2.2 Tailwind theme
- Copy `tailwind-theme.css` into `src/styles/theme.css`. Change nothing in the colors; the greys were chosen for contrast.
- Add **type-scale tokens** (`--text-h1`, `--text-verdict`, `--text-h2`, `--text-h2-signoff`, `--text-h3`, `--text-lede`, `--text-body-lg`, `--text-row-title`, `--text-metric-xl`, `--text-metric-tile`, `--text-eyebrow`, `--text-label`, `--text-badge`) with bundled `--line-height`, `--letter-spacing` and `--font-weight`, using the values in `tokens.json`. Mobile sizes use responsive variants (e.g. `text-h1-m md:text-h1`). Use that one pattern everywhere.
- **Breakpoints:** Tailwind defaults. `md` (768) switches the nav, tables, suite rows and the runs table. `lg` (1024) switches the 2-column hero, the quality-tile grid and the horizontal stage report. Verify 390, 768, 1024 and 1440.
- **Container:** `--container-report: 1120px`, applied as `mx-auto max-w-report px-4 sm:px-5 lg:px-8`.
- In the code-side token copy, change `lighthouseThresholds.pass` to **95** (§9 D7).

### 2.3 Repo layout (target)
```
.
├── .github/workflows/quality.yml   # PR + main + weekly schedule + dispatch
├── docs/handoff/                   # the handoff folder, verbatim
├── public/
│   ├── Anderson_Vanegas_Resume.pdf
│   ├── robots.txt
│   └── favicon.svg                 # "AV" mark
├── scripts/
│   ├── check-node.mjs              # ported
│   ├── check-glyphs.mjs
│   ├── check-content.mjs           # launch guard (STRICT_CONTENT=1)
│   └── ci/
│       ├── stage.sh                # wraps a stage; appends {name,start,end,exit} to reports/stages.jsonl
│       ├── collect-report.mjs      # playwright + axe + lhci + stages + history → reports/quality-report.json
│       ├── validate-report.mjs     # ajv against src/schemas/quality-report.schema.json
│       ├── equivalence.mjs         # build B == build A outside § 04
│       └── record-history.mjs      # updates history.json on the quality-history branch
├── src/
│   ├── content.config.ts
│   ├── content/
│   │   ├── site.json
│   │   └── suites/{boston-dynamics,sharkninja}.json
│   ├── data/quality-report.sample.json   # dev-only sample (updated per §9 D7)
│   ├── schemas/quality-report.schema.json # copy of the handoff schema + the §5.4 extensions
│   ├── lib/{report,quality,format,status,version}.ts
│   ├── components/
│   │   ├── primitives/   # StatusBadge, Chip, Button, Container, Section, Eyebrow, Icon
│   │   ├── report/       # SectionHeader, ReportMetaStrip, KeyValueCard, MetricTile
│   │   ├── suites/       # SuiteCard, SuiteTotals, TestCaseRow.tsx, TestCaseRowStatic, TestCaseStory, Terminal
│   │   ├── environment/  # ToolMatrix
│   │   ├── quality/      # QualityReport, ScoreRing, QualityTile, StageReport, RunsTable, SampleDataNotice
│   │   ├── signoff/      # SignOff, Approvals, KnownIssue
│   │   └── chrome/       # SiteNav, MobileMenu.tsx, SkipLink, Footer
│   ├── sections/         # Summary, Suites, Environment, Quality, SignOff
│   ├── layouts/BaseLayout.astro
│   ├── pages/{index.astro,404.astro,og.png.ts}
│   └── styles/{global.css,theme.css,print.css}
├── tests/
│   ├── e2e/*.spec.ts
│   ├── a11y/axe.spec.ts
│   └── fixtures/
├── lighthouserc.cjs
├── playwright.config.ts
├── vercel.json
└── astro.config.mjs
```

### 2.4 Page composition
`index.astro` = `BaseLayout` → `SkipLink` → **sticky** `SiteNav` → `<main id="main">` with five sections (`#summary`, `#suites`, `#environment`, `#quality`, `#signoff`), each `aria-labelledby` its heading → `Footer`.
- Sections alternate between `paper` and `paper-alt` backgrounds with top and bottom rules, through `Section tone="paper|alt"`.
- Every section has `scroll-margin-top` equal to the nav height (72px desktop, 60px mobile).
- Smooth scrolling is on only under `prefers-reduced-motion: no-preference`.

### 2.5 Islands (the only client JS)
| Island | Directive | Scope |
|---|---|---|
| `TestCaseRow.tsx` | `client:visible` | **Only rows with a story.** Owns the `<button>` and the panel's `hidden` state. The story is Astro markup passed as `children`, so React ships no story content |
| `MobileMenu.tsx` | `client:media="(max-width: 767px)"` | Disclosure menu and the current-section indicator ("§ 04"), using IntersectionObserver |

- Rows **without** a story render through `TestCaseRowStatic.astro`: the same layout, no button, not expandable (§9 D2). Today only BD-004 has a story.
- **Without JS:** BD-004 is SSR'd open. A `<noscript><style>` rule reveals every panel.

---

## 3. Component breakdown (README §4)

| Component | Props / API | Island | Notes |
|---|---|---|---|
| `StatusBadge` | `status: pass\|warn\|fail\|info\|neutral`, `label?`, `size?: sm\|lg`, `icon?: 'check'` | No | Mono 11/600, tracking 0.06em, uppercase, 6px dot (`aria-hidden`), tint bg + `fg`. Always has a text label. `lg` is the hero "OVERALL: PASS" with an SVG check |
| `SectionHeader` | `eyebrow`, `title`, `titleSuffix?`, `lede?`, `headingId`, slot `aside` | No | `aside` holds `SuiteTotals` in § 02 and the LIVE badge with run info in § 04 |
| `ReportMetaStrip` | `items: {key, value}[]` | No | `<dl>`, 4 columns desktop / 2×2 mobile, 1px `ink` top rule. **Same values at every size** (full name, full timestamp). Values may wrap on mobile |
| `KeyValueCard` | `title`, `badge?`, `rows: {key, value, note?}[]` | No | "Test subject" card |
| `MetricTile` | `value`, `label`, `status?`, `size: hero\|tile` | No | Big mono number |
| `SuiteCard` | `suite` | No | Chip (`info` current / `neutral` past), company, title, dates ("2023 — present"), "n/n passed" + decorative bar (`aria-hidden`), table header (≥ md), rows |
| `SuiteTotals` | computed | No | "9 run · 9 passed · 0 failed · 0 skipped" |
| `TestCaseRow` | `id`, `title`, `area`, `status`, `defaultOpen`, `children` | Yes | `<button aria-expanded aria-controls="story-BD-004">`. Panel: `<div id role="region" aria-labelledby>`. Desktop grid `112px 1fr 150px 96px 24px`; below `md`, a stacked row "BD-004 · Tooling [PASS]" / title. Several rows can be open at once. The chevron rotates only with motion allowed |
| `TestCaseRowStatic` | same minus `defaultOpen` | No | Same layout, no button, no chevron |
| `TestCaseStory` | `story` | No (children) | Order at every size: **Precondition → Steps (`<ol>`) → Expected → Actual → Terminal → Tags** (the desktop order). `pass-surface` background, `text-3` body |
| `Terminal` | `lines` | No | Mono block. The text result (`ok` / `live` / `armed`) plus color carries status. The `▍` cursor is a CSS block that **blinks only under `prefers-reduced-motion: no-preference`** and is static otherwise |
| `ToolMatrix` | `groups`, `testBeds` | No | `ink` top rule, group label with chips. Test beds use neutral chips and aren't counted |
| `ScoreRing` | `score`, `label` | No | SVG ring. **≥ 95 pass, 50–94 warn, < 50 fail** (matches the gate, §9 D7). `role="img"` + `aria-label="Performance: 98 out of 100"`; the number is HTML text |
| `QualityTile` | `title`, `status`, slots | No | axe, Playwright, last deploy and pipeline tiles |
| `StageReport` | `stages`, `runNumber` | No | `<ol>`, horizontal at `lg`, vertical below. The header "7/7 stages green" is computed. The latest run's Deploy stage shows "live" instead of a duration (§5.3) |
| `RunsTable` | `runs`, `actionsUrl` | No | Desktop: `<table>` with an sr-only `<caption>`. Mobile: stacked `<ul>`. `note` shows under the message. The run number links to `url` |
| `SignOff` | `signoff`, `contact` | No | CTAs, `Approvals` `<dl>` (placeholder styling for "You, hopefully" and `____-__-__`), and the `KnownIssue` card KI-01 (`warn`, "WON'T FIX") |
| `SiteNav` / `MobileMenu` | `sections` | Mobile only | Desktop: AV mark, "Test Report v{version}", links 01–05, and a "Download report (PDF)" button linking to the résumé. Mobile: mark, "§ NN" indicator, and a 44×44 button (`aria-label="Open sections menu"`, `aria-expanded`, `aria-controls`). Escape or a link click closes the menu and returns focus |
| `SkipLink`, `Footer`, `Container`, `Section`, `Chip`, `Button`, `Icon`, `Eyebrow` | | No | Shared building blocks. Footer year = build year |
| `SampleDataNotice` | | No | "SAMPLE DATA, not from CI" badge. It renders only when § 04 uses the sample file, which can't happen in production (§4.4) |

---

## 4. Content model

### 4.1 Collections (`src/content.config.ts`)
| Collection | Loader | Shape |
|---|---|---|
| `site` | `file('src/content/site.json', { parser: t => [{ id: 'site', ...JSON.parse(t) }] })` | Singleton |
| `suites` | `glob({ pattern: '*.json', base: 'src/content/suites' })` | One file per employer, sorted by `order`, then `start` descending |

The quality report is **not** a collection. `src/lib/quality.ts` loads it from the `QUALITY_REPORT` path at build time (§4.4).

### 4.2 Zod schemas (summary)
```ts
Status = z.enum(['pass','warn','fail','info'])

Story = z.object({
  precondition: z.string(), steps: z.array(z.string()).min(1),
  expected: z.string(), actual: z.string(),
  terminal: z.array(z.union([
    z.object({ cmd: z.string() }),
    z.object({ line: z.string(), result: z.string(), status: Status }),
  ])).optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
})

Case = z.object({
  id: z.string().regex(/^[A-Z]{2}-\d{3}$/), title: z.string(), area: z.string(),
  status: Status, defaultOpen: z.boolean().default(false),
  story: Story.optional(),                    // absent → non-expandable row
}).refine(c => !c.defaultOpen || c.story, 'defaultOpen requires a story')

Suite = z.object({
  id: z.string().regex(/^[A-Z]{2}$/), company: z.string(), title: z.string(),
  start: z.string(), end: z.string().nullable(), chip: z.enum(['info','neutral']),
  order: z.number().optional(), cases: z.array(Case).min(1),
}).refine(s => s.cases.every(c => c.id.startsWith(s.id + '-')))

Metric = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('static'), value: z.string(), label: z.string(), status: Status.optional() }),
  z.object({ kind: z.literal('computed'), metric: z.enum(['suiteCount','toolCount','passRate','caseCount']),
             label: z.string(), status: Status.optional() }),
])

Contact = z.object({ email: z.string().email(), linkedin: z.string().url(),
                     github: z.string().url(), resumePdf: z.string() })
```

### 4.3 Content changes from the handoff JSON
- Drop every `$note` / `$status` key. BD-004's story gets `draft: true` until Anderson confirms the wording and supplies the impact.
- `report.id`, `report.version` and `report.generated` are **removed from content** and computed (§4.5).
- `report.environment` becomes `report.location: "Boston, MA"`. The UTC offset is computed (§4.5).
- `hero.titleSuffix` becomes a template (`"— Test Report {version}"`) filled at build time. Use the same template for the nav label, `<title>` and the OG image.
- Metrics: `"COMPUTED: …"` strings become `kind: 'computed'`. "6+" stays `static`.
- **Copy stays as written**, jokes included: "0 critical escapes", "100% pass rate (we checked twice)", "faster than the coffee machine" (§9 D1). Anderson will edit copy later in the JSON.
- `contact` (§9 D3):
  - `email`: `avanegas95@gmail.com`, rendered as a `mailto:` link labeled "Email avanegas95@gmail.com"
  - `linkedin`: `https://www.linkedin.com/in/avanegas95/`
  - `github`: `https://github.com/avanegas95`
  - `resumePdf`: `/Anderson_Vanegas_Resume.pdf`
- Split the suites into `src/content/suites/boston-dynamics.json` (`order: 1`) and `sharkninja.json` (`order: 2`).
- The quality section lede says "states", not "pages", wherever scans are counted (§9 D11). The § 04 axe caption reads "axe-core · WCAG 2.2 AA · {n} states scanned".

### 4.4 Guards
- **`check-content.mjs`** runs in Lint. It flags any string containing `PLACEHOLDER`, `[ADD IMPACT`, `[YOUR EMAIL]` or `COMPUTED:`, and any story with `draft: true`. It **warns** by default and **fails** when `STRICT_CONTENT=1`. Strict mode is turned on for production builds in M6. **BD-004 is currently the only item that blocks launch.**
- **Quality data (`quality.ts`):** validated with Zod. CI also validates with ajv against `src/schemas/quality-report.schema.json`.
  - `QUALITY_REPORT` unset in dev or a local build → use `src/data/quality-report.sample.json` and render `SampleDataNotice`.
  - `QUALITY_REPORT` unset in a production CI build (`DEPLOY_ENV=production`) → **fail the build**.
  - Report present but `runs` empty (the first-ever run) → render an empty state: "First run. History starts here."

### 4.5 Computed values (`src/lib/report.ts`, `version.ts`, `format.ts`)
| Value | Rule |
|---|---|
| `BUILD_TIME` | `process.env.BUILD_TIME` (ISO) or now. CI sets it once so both builds match |
| `version` | `v{YYYY}.{M}` from `BUILD_TIME` in `America/New_York`, no zero padding (Sept 2026 → `v2026.9`) (§9 D10) |
| `report.id` | `AV-{YYYY}.{M}` |
| `generated` | `YYYY-MM-DD HH:mm {EDT\|EST}` in `America/New_York` |
| `environment` | `"{location} · UTC{offset}"`: the location ("Boston, MA") comes from content; the offset (`−4` / `−5`) is computed from `BUILD_TIME` in `America/New_York`, so it's correct in winter too |
| Totals | `caseCount`, `passed`, `failed`, `skipped`; per-suite `passed/total` |
| `passRate` | `round(passed / caseCount × 100)%` |
| `suiteCount` | number of suites |
| `toolCount` | Σ `tools[].items.length` (testBeds excluded) |
| `overallStatus` | `fail` if any case fails, else `warn` if any warns, else `pass` |
| `statusLine` | `${passed}/${total} cases · 0 critical escapes · 0 open blockers` |
| Footer year | build year |

---

## 5. CI/CD: the Live Quality Report

### 5.1 GitHub Actions orchestrates; Vercel only hosts
- One workflow, `.github/workflows/quality.yml`, runs every stage and then deploys a **prebuilt** output: `vercel pull --yes --environment=production`, then `vercel build --prod`, then `vercel deploy --prebuilt --prod`.
- 🔑 Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- `vercel.json`: `"git": { "deploymentEnabled": false }`. Vercel never builds on push, so production can only be reached through the gates.
- Why not Vercel-native builds and checks: Vercel promotes the artifact it tested, which can't contain its own results. Vercel previews send `X-Robots-Tag: noindex`, which fails Lighthouse SEO. And three-browser Playwright, LHCI and history writes need a real CI runner anyway.
- 🔑 The GitHub repo must be **public**. The "View all in GitHub Actions" link has to work for visitors, and public repos get free Actions minutes.

### 5.2 Pipeline
- Single job in `mcr.microsoft.com/playwright:v<version matching @playwright/test>-noble`. Browsers are preinstalled; LHCI uses its Chromium via `CHROME_PATH`.
- npm cache is keyed on `package-lock.json`.
- Every stage runs through `scripts/ci/stage.sh <Name> -- <cmd>`, which records wall-clock timings.

```
triggers: pull_request · push main · schedule (weekly, Mon 13:00 UTC) · workflow_dispatch
concurrency: group quality-${{ github.ref }}; cancel-in-progress only for PRs

 0 Setup        checkout · fetch origin/quality-history → .quality/history.json (missing → bootstrap)
                BUILD_TIME=$(date -u +%FT%TZ) exported for the whole job
 1 Install      npm ci                                                        [stage Install]
 2 Lint         eslint · prettier --check · astro check · check-glyphs · check-content  [stage Lint]
 3 Build A      QUALITY_REPORT=.quality/current.json astro build → dist/      [stage Build]
                (current.json = history.deployed, i.e. what's live now)
 4 Serve A      sirv dist --port 4321 --brotli --gzip (background)
 5 Playwright   project e2e × chromium/firefox/webkit → reports/playwright.json  [stage Playwright]
 6 axe          project a11y (chromium) → reports/axe.json                    [stage axe]
 7 Lighthouse   lhci collect (3 runs, mobile) → reports/lhci/                 [stage Lighthouse]
 8 Collect      collect-report.mjs → reports/quality-report.json; validate-report.mjs
                evaluate gates → status pass | warn | fail
 ── if fail: skip 9–11 ──
 9 Build B      vercel build --prod with QUALITY_REPORT=reports/quality-report.json
10 Verify B     equivalence.mjs A vs .vercel/output/static · axe on B · e2e @quality smoke on B (chromium)
11 Deploy       main/schedule/dispatch: vercel deploy --prebuilt --prod       [stage Deploy]
                PR (same-repo only): vercel deploy --prebuilt (preview)
12 Record       if: always(), non-PR only → record-history.mjs → push quality-history
```
- Steps 5–7 use `continue-on-error: true`, and step 8 evaluates the gates explicitly. A failed run therefore still reports every number it produced.
- Write the gate summary to `$GITHUB_STEP_SUMMARY` on every run.

### 5.3 The chicken-and-egg problem: two-pass build with an equivalence proof
1. **Build A** renders § 04 from the currently deployed report, so its structure matches the final page. All gates run on A.
2. The collector writes **this run's** results into a new report.
3. **Build B** is the same commit, the same `BUILD_TIME` and the new report.
4. `equivalence.mjs` parses every HTML file in A and B, removes the `[data-quality-region]` subtree (the whole § 04 `<section>`) and compares the rest byte for byte. Every non-HTML file must hash-match, including CSS, JS, fonts, `og.png` and the PDF. Any difference fails the run and names the file.
5. § 04 changed, so axe and the `@quality`-tagged Playwright tests run again on B.
6. Deploy B.

**Fallback:** if Astro output proves non-deterministic in a way that can't be fixed, set `QUALITY_MODE=previous`. Build A then deploys directly, and § 04 labels itself "previous run". Don't take this fallback without telling Anderson.

**Latest run on the page (§9 D8):**
- The Deploy stage shows **PASS · "live"** with no duration.
- "Pipeline duration" = run start → deploy start, labeled "to release".
- "Last deploy" = the time Build B was stamped.
- `record-history.mjs` stores the final durations, including deploy, for the Recent runs table.

### 5.4 Report schema: extensions to the handoff schema
Copy `docs/handoff/ci/quality-report.schema.json` to `src/schemas/` with these changes:
- `latest.stages[].durationSeconds`: `number | null` (null = the in-flight Deploy stage).
- `latest.durationScope`: `"to-deploy" | "total"`.
- Top-level `actionsUrl` (string, uri).
- `latest.axe.statesScanned` replaces `pagesScanned`.
- `status` semantics:
  - `fail` = a blocking gate broke and nothing shipped.
  - `warn` = shipped, but the pipeline exceeded its 180s budget.
  - Lighthouse below 95 is always `fail` (§9 D7).

Update `src/data/quality-report.sample.json` to match:
- `#211` becomes `"status": "fail"`, `"note": "Lighthouse perf 93 < 95. Blocked."`.
- One sample run becomes `warn` for pipeline duration (e.g. `durationSeconds: 191`, `note: "Pipeline 3m 11s, over the 3m budget."`), so the WARN styling stays covered.
- Use `statesScanned: 6`.

### 5.5 Gates
| Gate | Threshold | Breach → |
|---|---|---|
| Lint, type check, glyphs, content guard | pass | fail |
| Playwright E2E | 100% passed, 0 skipped | fail |
| axe-core | 0 violations; tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` | fail |
| Lighthouse | per-category **median of 3**, mobile, **≥ 95** for performance, accessibility, best practices and SEO | fail |
| Equivalence (A vs B) | identical outside § 04 | fail |
| Pipeline duration | ≤ 180s | **warn** (ships) |

The collector computes medians from all three LHRs. Failures are never auto-retried.

### 5.6 Run history: `quality-history` orphan branch
- Holds one file, `history.json`: `{ deployed: <full report of the live run>, runs: [<runSummary>, …max 20] }`. The page shows the most recent 10.
- **Main pushes, scheduled runs and manual dispatches are recorded. PRs are not** (§9 D9).
- Failed runs are recorded without changing `deployed`. They appear on the site after the next successful deploy.
- `note` is generated from the first failing gate or breached budget (e.g. "axe: 1 violation (color-contrast). Blocked."). If a run with the same `number` already has a note (a hand edit), keep it.
- Scheduled runs use the message `scheduled: weekly re-verification`.
- Pushes use rebase-and-retry, up to 3 attempts. Workflow `permissions`: `contents: write` for non-PR events, `contents: read` for PRs.
- Bootstrap: if the branch doesn't exist, create it as an orphan on the first non-PR run. Never seed fake runs.

### 5.7 Playwright suite
The count is shown publicly, so every test must be meaningful. The total is whatever the tests add up to; it isn't a target. Tag the § 04 tests `@quality`.

1. Page loads with no console errors or page errors (a fixture applies this to every test).
2. Five sections render in order with their eyebrows; `header`/`nav`/`main`/`footer` landmarks exist.
3. The skip link is the first tab stop and moves focus to `main`.
4. Desktop nav links update the hash, and each section's heading isn't hidden under the sticky nav.
5. Mobile menu: the button is ≥ 44×44 and toggles `aria-expanded`; a link click navigates and closes; Escape closes and returns focus; the indicator updates on scroll.
6. BD-004 is open by default (`aria-expanded="true"`, visible panel, `aria-controls` resolves).
7. Clicking toggles a row, and `aria-expanded` and `hidden` stay in sync.
8. Enter and Space toggle a row, and `:focus-visible` has a visible outline.
9. Rows without a story aren't buttons.
10. Computed values match the content files (suites, tools, pass rate, per-suite n/n, "9/9 cases", version = build month).
11. `@quality`: § 04 values match the injected report; there are ≤ 10 runs; FAIL and WARN rows have text labels; the Deploy stage shows "live".
12. Every status badge has a visible text label.
13. At 390px there's no horizontal overflow, and the suite and runs tables use the stacked layout.
14. SEO: title, description, canonical, OG and Twitter tags; the `Person` JSON-LD parses; `/og.png` returns 200 `image/png`.
15. Both résumé links resolve to a 200 PDF, and the email link is `mailto:avanegas95@gmail.com`.
16. Reduced motion: no smooth scroll, and the cursor animation is `none`.

The **axe project** (Chromium) scans 6 states: desktop default, desktop with all expandable rows open, mobile default, mobile with the menu open, print media, and the 404 page. The report records `statesScanned` from the actual count.

---

## 6. Other non-functional work
- **Accessibility (WCAG 2.2 AA):**
  - Keep the greys as given. `faint` is for decoration or large text only.
  - `:focus-visible` ring: 2px `info` with an offset.
  - One H1, then an H2 per section.
  - Targets ≥ 24px; 44px for the menu button.
  - Reduced motion disables smooth scroll, chevron rotation and the cursor blink.
  - Each milestone's exit includes a manual keyboard-only pass and a VoiceOver spot check (macOS Safari and iOS), because axe doesn't catch everything.
- **Performance:**
  - No JS beyond the two islands, no images above the fold, and `inlineStylesheets: "auto"`.
  - `vercel.json` gives `/_astro/*` and fonts `Cache-Control: public, max-age=31536000, immutable`.
- **SEO/sharing:**
  - `<title>` "Anderson Vanegas — Test Report {version}", meta description, and a canonical URL from `SITE_URL`.
  - `@astrojs/sitemap` and `robots.txt`.
  - OG and Twitter `summary_large_image` tags.
  - `Person` JSON-LD: name, jobTitle "Staff SQA Engineer", worksFor Boston Dynamics, alumniOf Boston University, address Boston, MA, and sameAs pointing to LinkedIn and GitHub.
- **OG image** (`src/pages/og.png.ts`): a 1200×630 "report cover" rendered with satori + resvg and the Plex fonts. It shows the report ID, name, the OVERALL: PASS badge, the verdict and the version. It must be deterministic for a given `BUILD_TIME` and content.
- **Résumé:** "Download report (PDF)" in the nav and "Résumé (PDF)" in Sign-off both link to `/Anderson_Vanegas_Resume.pdf` with the `download` attribute (§9 D4). There's no CI-generated PDF.
- **Print (lightweight, M3):** `print.css` hides the nav, CTAs and skip link, expands every story, prints link URLs after contact links, and avoids breaks inside rows.
- **Security headers** (`vercel.json`): HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and a CSP. For the CSP, use Astro's hash-based CSP support if it's stable in the installed version; otherwise a hand-written policy with hashes for the island bootstrap. Verify the CSP doesn't break hydration in all 3 browsers (the e2e suite covers this).
- **404:** "Test not found." with a `StatusBadge` reading "404 · NOT RUN" and a link back to `#summary`.

---

## 7. Milestones

"Ship" means production on the Vercel project's `*.vercel.app` URL. avanegas.com stays on the old GitHub Pages site until M6.

### M0: Repo prep
- Delete the prototype files, move the handoff to `docs/handoff/`, extend `.gitignore`, and write the new README.
- Scaffold Astro 6 with React, Tailwind v4 (Vite plugin) and the ported tooling (§1.2). Copy the résumé PDF.
- Make the first commit on `main`.
- 🔑 Anderson creates the **public** GitHub repo and adds the remote, creates the Vercel project on his personal account, disables Git deployments, and adds the 3 secrets.
- **Exit:** `npm run lint` and `npm run build` pass on a placeholder page; the push to GitHub is done.

### M1: Static site from the mockups
- Theme tokens, type scale, fonts, SVG icons and `check-glyphs`.
- Every component and section, rendering from direct JSON imports.
- BD-004 renders open statically. § 04 renders the sample file with `SampleDataNotice`.
- Sticky nav with desktop links (the mobile menu island comes in M3; until then the mobile nav can link to `#summary`).
- 🔑 First deploy is manual (`vercel deploy --prod` from Anderson's machine, or by the agent if Anderson provides a logged-in CLI). It's the only ungated deploy.
- **Exit:** side-by-side screenshots against `Main.dc.html` at 1440 and the three mobile mockups at 390 (layout only; copy follows desktop); no horizontal scroll at 390, 768 or 1024.

### M2: Content collections and computed values
- `content.config.ts`, the schemas, the content changes in §4.3, `report.ts` / `version.ts` / `format.ts`, and `check-content` in warn mode.
- **Exit:** a temporary third suite file updates every count with no markup change (then remove it); an invalid content file fails the build with a readable Zod error; the version shows `v2026.9` for a September build and `v2026.10` for a stubbed October `BUILD_TIME`.

### M3: Interactivity, accessibility, SEO, print
- The `TestCaseRow` and `MobileMenu` islands, the no-JS fallback and reduced-motion handling.
- Skip link, focus styles, 404, JSON-LD, OG endpoint, sitemap, robots, `print.css` and security headers.
- **Exit:** manual keyboard and VoiceOver pass; local Lighthouse (mobile) ≥ 95 in every category; the print preview is readable.

### M4: Tests and gated CI
- The Playwright e2e and a11y projects, `lighthouserc.cjs`, `stage.sh`, and `quality.yml` stages 0–8. Deploy build A directly for now.
- 🔑 Anderson enables branch protection on `main`, requiring the `quality` check.
- **Exit:** a deliberately broken PR (e.g. lightening `muted` to fail contrast) goes red and can't merge; a green merge deploys.

### M5: Live Quality Report
- `collect-report`, `validate-report`, the schema extensions, the two-pass build, `equivalence`, the B re-verification, `record-history`, the `quality-history` branch and the weekly schedule.
- Production builds without `QUALITY_REPORT` fail.
- **Exit:**
  - After a merge, the site shows that run's number, SHA, scores and "live" Deploy stage.
  - A failing push to main appears as FAIL in Recent runs after the next green deploy.
  - A planted difference outside § 04 makes `equivalence.mjs` fail (tested once, then reverted).
  - A manual `workflow_dispatch` of the schedule path works.

### M6: Launch and domain cutover
- **Content (Anderson):** the BD-004 impact and confirmed wording (clear `draft`). Then set `STRICT_CONTENT=1` for production.
- **Canonical host:** apex `avanegas.com`, with `www` redirecting to it.
- 🔑 **Cutover (Anderson; the agent provides a checklist with exact values from the Vercel dashboard):**
  1. In Vercel, add `avanegas.com` and `www.avanegas.com` to the project.
  2. In **Namecheap**, go to Advanced DNS.
     - Remove the four GitHub Pages `A` records (`185.199.108–111.153`) and any `www` CNAME pointing to `avanegas95.github.io`.
     - Add the `A` record for `@` and the `CNAME` for `www` exactly as Vercel shows them.
     - Remove any Namecheap URL-redirect or parking records.
     - **Don't touch MX or TXT records.**
  3. In the old `avanegas95.github.io` repo: delete `CNAME` (root and `public/`), disable GitHub Pages in Settings → Pages, then archive the repo.
  4. Wait for Vercel to show the domains as valid and HTTPS issued.
- **Agent, after DNS:**
  - Add redirects in `vercel.json` (`/blog` and `/blog/:path*` → `/`, 308).
  - Run the pipeline once so § 04 shows the cutover run.
  - Verify HTTPS, canonical URLs, the OG preview (LinkedIn Post Inspector) and the sitemap. Remind Anderson to update Search Console.
- **Exit:** avanegas.com serves the new site over HTTPS; old blog URLs redirect; the weekly run is scheduled.

---

## 8. Anderson's action list (🔑)
| When | Action |
|---|---|
| M0 | Create a **public** GitHub repo (any name; renaming later is safe) and give the agent its URL |
| M0 | Create the Vercel project on the **personal Hobby account**; Settings → Git: disable automatic deployments (or rely on `vercel.json`); create a token; add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` as repo secrets |
| M1 | Run (or allow) the one manual first deploy |
| M4 | Branch protection on `main`: require the `quality` check |
| Before M6 | Supply the BD-004 impact and confirm the story wording. Write other stories whenever; each one makes its row expandable automatically |
| M6 | Namecheap DNS changes, disable Pages and archive the old repo, Search Console |
| Any time | Copy edits go in `src/content/*.json`. Hand-edit run notes on the `quality-history` branch if wanted |

---

## 9. Decisions log (final; don't reopen)
| # | Topic | Decision |
|---|---|---|
| D1 | "0 critical escapes", "100% pass rate", other jokes | **Keep as written.** Anderson will revise copy himself later |
| D2 | Test cases without stories | **Non-expandable** until Anderson writes them |
| D3 | Contact | Reuse the existing links: `mailto:avanegas95@gmail.com` (plain mailto), `linkedin.com/in/avanegas95`, `github.com/avanegas95` |
| D4 | PDFs | "Download report (PDF)" **is the résumé** (`/Anderson_Vanegas_Resume.pdf`). No CI-generated PDF. Print CSS stays as a lightweight extra |
| D5 | Repo | **New repo:** this `test-report-portfolio` repo. Repo and site name may change later, so nothing is hard-coded (§1.3) |
| D6 | Blog and Projects | **Dropped** for v1; old `/blog` URLs redirect to `/` at cutover |
| D7 | Lighthouse gate vs ring color | **Strict gate ≥ 95 = fail.** ScoreRing pass threshold matches: ≥ 95 pass, 50–94 warn, < 50 fail. `warn` status is used only for the pipeline-duration budget |
| D8 | Latest run's Deploy stage | **PASS · "live"**, pipeline duration measured to deploy start |
| D9 | History scope | **Main, scheduled and manual runs only**; PRs aren't recorded |
| D10 | Report ID / version | **Derived from the build month** (`AV-2026.9` / `v2026.9`) |
| D11 | axe count wording | **"states scanned"** |
| D12 | Mobile mockup copy differences | **Leftovers.** Desktop copy and story order everywhere; mobile changes layout only. The meta strip shows full values and may wrap |
| D13 | Nav | **Sticky** on all sizes |
| D14 | Terminal cursor | **Blinks only when motion is allowed** |
| D15 | DNS | **Namecheap**; Anderson has access and does the change at M6. Canonical host is apex |
| D16 | Vercel account | Anderson's **personal** account |
| D17 | Scheduled runs | **Weekly redeploy** (Mondays), recorded in history |

## 10. Risks
| Risk | Mitigation |
|---|---|
| Lighthouse performance varies on CI runners, and a strict 95 gate blocks deploys at random | Static page, 2 small islands, preloaded subset fonts, median of 3. Failures are shown honestly. If flakiness persists, report to Anderson; don't loosen the gate yourself |
| Astro output isn't byte-identical across the two builds | Pinned `BUILD_TIME`, deterministic props, the equivalence check detects it, and the `QUALITY_MODE=previous` fallback exists (only with Anderson's OK) |
| Pipeline exceeds the 180s budget | Container image, npm cache, parallel Playwright workers. It's warn-only |
| React runtime weight | Only 2 islands, lazy directives. Measure in M3 |
| Concurrent writes to `history.json` | Concurrency group plus rebase-and-retry |
| GitHub Pages still claims the domain after cutover | Cutover steps 2–3 (§7 M6) |
| Placeholder or draft content ships | `STRICT_CONTENT=1` in production from M6 |
| Hard-coded repo or domain breaks after a rename | `SITE_URL` and CI-derived URLs (§1.3); e2e test 14 checks the canonical URL |
