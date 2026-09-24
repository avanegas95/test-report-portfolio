# Kickoff prompt — paste into the implementing agent

> Recommended: Claude Code, run inside the avanegas.com repo (or an empty new repo), in **plan mode**. Put this `test-report-handoff/` folder in the repo root (or attach it).

---

I'm rebuilding my portfolio site, avanegas.com, from a finished design. Everything you need is in the `test-report-handoff/` folder.

1. Read `test-report-handoff/README.md` first; it's the brief and source of truth.
2. Then read the four mockups in `test-report-handoff/design/`. They are exported design source with inline styles: use them for exact visuals and copy, but don't port the canvas runtime (`<x-dc>`, `<helmet>`, `support.js`, `data-dc-script`).
3. Use `theme/`, `content/` and `ci/` as the starting tokens, content and data contract.

**Your task right now is an implementation plan only, with no code yet.** The plan should cover everything in README §9, and specifically:
- Astro + Tailwind + React islands architecture and file structure
- Components mapped to README §4
- Content collections built from `content/*.json`
- The CI/CD design for the Live Quality Report (README §5), including how you solve the "results of the run that deployed it" problem, and whether to use GitHub Actions or Vercel-native checks
- Phased milestones, each shippable on its own
- A list of open questions for me; don't guess on anything flagged "decisions for Anderson"

If the current repo already has a site, briefly assess what to keep and what to replace before planning.

Write the plan to `PLAN.md` and stop for my review.
