import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export function repoPath(...segments) {
  return resolve(rootDir, ...segments);
}

export const PATHS = {
  root: repoPath(),
  playwright: repoPath("reports/playwright.json"),
  axe: repoPath("reports/axe.json"),
  lhci: repoPath("reports/lhci"),
  stages: repoPath("reports/stages.jsonl"),
  history: repoPath(".quality/history.json"),
  current: repoPath(".quality/current.json"),
  qualityReport: repoPath("reports/quality-report.json"),
  schema: repoPath("src/schemas/quality-report.schema.json"),
  buildA: repoPath("dist"),
  buildB: repoPath(".vercel/output/static"),
};
