# Handoff — "The Test Report" portfolio (avanegas.com)

**Owner:** Anderson Vanegas · **Prepared:** 2026-09-24 · **Status:** Design approved for implementation planning

Start here. This folder is everything an implementing agent needs to plan the build of Anderson's portfolio site. **Your first job is a written implementation plan, not code** (see `PROMPT.md`).

---

## 1. Folder map

| Path | What it is |
|---|---|
| `README.md` | This brief — the source of truth for intent, scope and requirements |
| `PROMPT.md` | Copy-paste kickoff prompt for the implementing agent |
| `design/Main.dc.html` | Desktop full-page mockup (1440 px wide) — all five sections |
| `design/Mobile-Summary.dc.html` | Mobile (390 px) — § 01 Executive Summary |
| `design/Mobile-Suites.dc.html` | Mobile (390 px) — § 02 Test Suites, with BD-004 expanded |
| `design/Mobile-Quality.dc.html` | Mobile (390 px) — § 04 Live Quality Report + compact sign-off |
| `theme/tokens.json` | Design tokens (color roles, type, radii, spacing) |
| `theme/tailwind-theme.css` | The same tokens as a Tailwind v4 `@theme` block |
| `content/site.json` | Hero, report metadata, summary metrics, tools matrix, contact |
| `content/suites.json` | Work history as suites → test cases (real content) |
| `ci/quality-report.schema.json` | JSON Schema for the CI results file the site reads |
| `ci/quality-report.sample.json` | Sample results matching the mockup (**fake numbers**) |

### About the design files
The `.dc.html` files are exported from a design canvas. They are **reference source**: every style is inline, so exact colors, sizes, spacing and copy can be read straight from the markup. Custom tags (`<x-dc>`, `<helmet>`) and the `support.js` / `data-dc-script` bits are canvas runtime and **must not** be ported. Opening a file in a browser gives an approximate render. Rebuild the UI as Astro/React components with Tailwind; do not copy the inline styles.

---

## 2. Concept

**"The Test Report."** The whole site is styled as a polished QA release report. A visitor reads Anderson the way a manager reads a test report: organized, evidence-based, confident. The look is a beautifully designed PDF report brought to life: light, crisp, lots of white space, thin divider rules.

Tone: professional and recruiter-friendly, with sharp, slightly witty copy. Never corporate, never dry. The copy in the mockups is approved as a first draft.

### Sections (single page, anchor-linked)
1. **§ 01 Executive Summary.** Report metadata strip (ID, generated date, subject, environment), title "Anderson Vanegas — Test Report v2026.9", an OVERALL: PASS badge, the verdict line, a bio paragraph, CTAs, a "Test subject" key/value card and 4 summary metrics.
2. **§ 02 Test Suites.** Each employer is a suite; each accomplishment is a test case row: ID · title · area · PASS badge. Rows expand into a short story (Precondition → Steps → Expected → Actual, plus a terminal snippet and tags). One row (BD-004) is shown expanded.
3. **§ 03 Test Environment.** The tools matrix, grouped.
4. **§ 04 Live Quality Report.** A dashboard of **this site's own CI results**: Lighthouse scores, axe violations, Playwright pass count, last deploy, pipeline duration, stage-by-stage report and recent runs.
5. **§ 05 Sign-off.** "Approved for release. Pending your signature." Contact CTAs, approvals block and a playful "Known issue KI-01 · WON'T FIX."

---

## 3. Stack & hosting

- **Framework:** Astro, with React islands only where interactivity needs them (expandable rows, mobile nav). Everything else is static HTML.
- **Styling:** Tailwind (v4 preferred; tokens in `theme/`).
- **Fonts:** IBM Plex Sans (400/500/600/700) and IBM Plex Mono (400/500/600). Self-host (e.g. `@fontsource`) and subset; no Google Fonts request at runtime.
- **Hosting:** Vercel. The current avanegas.com is hosted on GitHub; this build **replaces** it, including the domain cutover.
- **Content:** Astro content collections driven by `content/*.json` (or converted to Markdown/MDX), so adding a job or test case never means editing markup.

---

## 4. Design system

Everything is in `theme/tokens.json`. Key rules:

- **Neutral palette; color only carries meaning.** Green = pass, amber = warn, red = fail, blue = info. Nothing is decorative color.
- **Badges** are pills: mono 11 px, weight 600, letter-spacing 0.06em, uppercase, with a 6 px status dot. Tint background + dark foreground per status.
- **Type:** sans for prose and headings; **mono for IDs, metrics, timestamps, labels and section eyebrows** ("§ 02 — TEST SUITES").
- **Rules:** a 1 px `rule` color for dividers; a 1 px `ink` rule marks the top of report blocks (metadata strip, tools matrix).
- **Section rhythm:** alternating white / `paper-alt` backgrounds with top and bottom rules.
- **Layout:** desktop content width 1120 px (160 px side padding at 1440); mobile 16–20 px gutters. Breakpoints are the implementer's call, but tables must collapse to the stacked mobile row pattern shown in `Mobile-Suites`.

### Components to extract
| Component | Notes |
|---|---|
| `StatusBadge` | `status: pass \| warn \| fail \| info`, optional label override (e.g. "OPEN TO TALK", "WON'T FIX"). Large variant for the hero (OVERALL: PASS with check icon). |
| `SectionHeader` | Mono eyebrow `§ NN — TITLE`, H2, lede paragraph, optional right-side slot (counts / LIVE badge). |
| `ReportMetaStrip` | 4-cell (2×2 on mobile) mono key/value strip with ink top rule. |
| `KeyValueCard` | "Test subject" card: header row + `<dl>` rows. |
| `MetricTile` | Big mono number + label; used in the hero row and quality tiles. |
| `SuiteCard` | Header (suite chip, company, title, dates, `n/n passed` + bar) + table header + rows. |
| `TestCaseRow` | Collapsed/expanded; **a real `<button aria-expanded aria-controls>`**; expanded panel = `TestCaseStory`. Desktop grid row → mobile stacked row. |
| `TestCaseStory` | Precondition, Steps (ordered list), Expected, Actual, optional terminal snippet, tags. |
| `ToolMatrix` | Grouped rows of mono chips. |
| `ScoreRing` | SVG ring, 0–100; color by threshold (≥90 pass, 50–89 warn, <50 fail). |
| `StageReport` | Horizontal stage steps (desktop) / vertical list (mobile) with status + duration. |
| `RunsTable` | Run #, commit, message, duration, status; mobile = stacked list. |
| `SignOff` | Approvals block + Known Issue card + contact CTAs. |

### Interactions
- Test case rows expand/collapse (accordion; several may be open at once). BD-004 is open by default.
- Nav links scroll to section anchors; on mobile a menu button (44×44, `aria-label`) opens the section list.
- Respect `prefers-reduced-motion`. No other animation is required.
- Dark mode: **not in scope** for v1 (the concept is a light, printed report).

---

## 5. The Live Quality Report — the hard part

The § 04 dashboard must show **real** results from the site's own pipeline, not hard-coded numbers.

**Required flow (plan should confirm or propose a better one):**
1. On every push to `main` (and on PRs), CI runs: install → lint → build → Playwright E2E (Chromium, Firefox, WebKit) → axe-core scan of every page → Lighthouse (mobile, median of 3) → deploy.
2. A script collects results into one file matching `ci/quality-report.schema.json`.
3. That file is available to the **next build** (committed to a data branch, stored as an artifact, or put in blob storage). The site renders it statically at build time. No client-side fetching is required for v1.
4. **Quality gates:** Lighthouse scores ≥ 95 in every category, 0 axe violations (WCAG 2.2 AA), and 100% of Playwright tests passing. A failed gate blocks deploy, so the site can truthfully say "if a check goes red, it doesn't ship."
5. Keep the last ~10 runs for the "Recent runs" table, including failed ones. Failing runs are shown honestly; that's part of the credibility.

**Chicken-and-egg to solve in the plan:** the deployed site shows the results of the run that deployed it, but those results exist only after the tests run against a build. Options include testing a preview deploy and then rebuilding, showing "previous run" results, or a two-stage pipeline. Pick one and justify it.

**Open choice:** GitHub Actions + Vercel deploy hook, or Vercel's own build + checks. The plan should recommend one.

---

## 6. Content status — real vs placeholder

**Real (from Anderson):** name, role, employers, dates, education, location, all test case titles, the tools list, the concept copy.

**Placeholder / must be replaced before launch:**
- Every number in § 04 (Lighthouse 98/100/100/100, 48/48 Playwright, 14:32 deploy, 1m 52s, runs #211–214, commit hashes, stage durations). These come from CI once it exists.
- `[ADD IMPACT]` in the BD-004 story; Anderson will supply a concrete outcome.
- `[YOUR EMAIL]`, LinkedIn, GitHub and résumé PDF URLs.
- BD-004 story wording is a draft; the other test cases have no story yet (collapsed rows need story content, or should be non-expandable until written).

**Copy decisions for Anderson (flag, don't guess):**
- "0 critical escapes" and "100% pass rate" are thematic jokes, not measured figures. Keep or soften?
- "13 tools" is a count of the tools list and should be computed from `site.json`, not hard-coded.

---

## 7. Non-functional requirements

- **Accessibility:** WCAG 2.2 AA. Text contrast ≥ 4.5:1 (the palette is chosen for this, so don't lighten the greys). Status is never conveyed by color alone (always a text label). Keyboard-operable accordion, visible focus, skip link, semantic landmarks.
- **Performance:** static by default; minimal JS (only the accordion + mobile nav islands); fonts subset and preloaded; Lighthouse ≥ 95 across the board.
- **SEO/sharing:** title, meta description, Open Graph image (a rendered "report cover"), `Person` JSON-LD.
- **Print:** a print stylesheet so "Download report (PDF)" can simply be the page printed to PDF. Nice-to-have; decide in the plan.
- **Tests:** Playwright tests should cover the site's own behavior (sections render, accordion toggles + aria state, nav anchors, mobile menu, no console errors) plus the axe scan. The test count is displayed publicly, so make them meaningful.

---

## 8. Out of scope for v1
Blog, CMS, dark mode, analytics dashboard, contact form backend (mailto is fine), i18n.

## 9. What the plan should deliver
1. Architecture and repo/file structure.
2. Component breakdown mapped to the table in §4.
3. Content model (collections + schema).
4. CI/CD design for §5, including the chicken-and-egg decision and the gate thresholds.
5. Phased milestones, each independently shippable (e.g. static site → content collections → CI gates → live report → domain cutover).
6. Risks and open questions for Anderson.
