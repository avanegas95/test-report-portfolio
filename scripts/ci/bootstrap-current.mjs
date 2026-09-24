#!/usr/bin/env node
/**
 * Bootstrap .quality/current.json from history.deployed or a first-run placeholder.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { PATHS } from "./lib/paths.mjs";
import { readJsonFileOptional } from "./lib/read-json.mjs";

function buildActionsUrl() {
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository =
    process.env.GITHUB_REPOSITORY ?? "avanegas95/test-report-portfolio";
  return `${server}/${repository}/actions`;
}

function buildRunUrl(runNumber) {
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository =
    process.env.GITHUB_REPOSITORY ?? "avanegas95/test-report-portfolio";
  return `${server}/${repository}/actions/runs/${runNumber}`;
}

function emptyFirstRunReport() {
  const generatedAt = process.env.BUILD_TIME ?? new Date().toISOString();
  const actionsUrl = buildActionsUrl();

  return {
    generatedAt,
    actionsUrl,
    budgets: {
      lighthouseMin: 95,
      axeMaxViolations: 0,
      pipelineMaxSeconds: 180,
    },
    latest: {
      number: 0,
      commit: "0000000",
      message: "First run. History starts here.",
      branch: process.env.GITHUB_REF_NAME ?? "main",
      durationSeconds: 0,
      durationScope: "to-deploy",
      status: "info",
      deployedAt: generatedAt,
      deployTarget: "Vercel",
      lighthouse: {
        formFactor: "mobile",
        runs: 0,
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
      },
      axe: {
        standard: "WCAG 2.2 AA",
        violations: 0,
        statesScanned: 0,
      },
      playwright: {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
      },
      stages: [],
    },
    runs: [],
  };
}

function main() {
  const history = readJsonFileOptional(PATHS.history, { runs: [] });
  const current =
    history.deployed && typeof history.deployed === "object"
      ? history.deployed
      : emptyFirstRunReport();

  mkdirSync(PATHS.root + "/.quality", { recursive: true });
  writeFileSync(PATHS.current, `${JSON.stringify(current, null, 2)}\n`);

  const source = history.deployed
    ? "history.deployed"
    : "first-run placeholder";
  console.log(`Bootstrapped ${PATHS.current} from ${source}.`);

  if (process.env.GITHUB_RUN_NUMBER) {
    console.log(
      `Current report run #${current.latest?.number ?? 0}; actions: ${buildRunUrl(process.env.GITHUB_RUN_NUMBER)}`,
    );
  }
}

main();
