/** Expected values when BUILD_TIME=2026-09-24T12:00:00Z (America/New_York → v2026.9). */
export const BUILD_TIME = "2026-09-24T12:00:00Z";
export const EXPECTED_VERSION = "v2026.9";
export const EXPECTED_REPORT_ID = "AV-2026.9";

export const SECTIONS = [
  { id: "summary", eyebrow: "§ 01 — EXECUTIVE SUMMARY" },
  { id: "suites", eyebrow: "§ 02 — TEST SUITES" },
  { id: "environment", eyebrow: "§ 03 — TEST ENVIRONMENT" },
  { id: "quality", eyebrow: "§ 04 — LIVE QUALITY REPORT" },
  { id: "signoff", eyebrow: "§ 05 — SIGN-OFF" },
] as const;

export const COMPUTED = {
  suiteCount: "2",
  toolCount: "13",
  passRate: "100%",
  totalCases: 9,
  statusLine: "9/9 cases · 0 critical escapes · 0 open blockers",
  suitePasses: [
    { company: "Boston Dynamics", label: "5/5 passed" },
    { company: "SharkNinja", label: "4/4 passed" },
  ],
} as const;
