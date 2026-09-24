#!/usr/bin/env node
/**
 * Collect CI artifacts into reports/quality-report.json and evaluate gates.
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { PATHS } from "./lib/paths.mjs";
import { readJsonFile, readJsonFileOptional } from "./lib/read-json.mjs";

const BUDGETS = {
  lighthouseMin: 95,
  axeMaxViolations: 0,
  pipelineMaxSeconds: 180,
};

const STAGE_ORDER = [
  "Install",
  "Lint",
  "Build",
  "Playwright",
  "axe",
  "Lighthouse",
  "Deploy",
];

function buildActionsUrl() {
  const server = process.env.GITHUB_SERVER_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!server || !repository) {
    throw new Error(
      "GITHUB_SERVER_URL and GITHUB_REPOSITORY are required to set actionsUrl.",
    );
  }
  return `${server}/${repository}/actions`;
}

function buildRunUrl(runNumber) {
  const server = process.env.GITHUB_SERVER_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!server || !repository) {
    return undefined;
  }
  return `${server}/${repository}/actions/runs/${runNumber}`;
}

function readStages() {
  if (!existsSync(PATHS.stages)) {
    throw new Error(`Missing stage log: ${PATHS.stages}`);
  }

  if (!readFileSync(PATHS.stages, "utf8").trim()) {
    throw new Error(`Stage log is empty: ${PATHS.stages}`);
  }

  const lines = readFileSync(PATHS.stages, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const stages = new Map();

  for (const [index, line] of lines.entries()) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid stages.jsonl line ${index + 1}: ${message}`);
    }

    if (!parsed.name || !parsed.start || !parsed.end) {
      throw new Error(
        `Invalid stages.jsonl line ${index + 1}: expected name, start, end, exit.`,
      );
    }

    const durationSeconds = Math.max(
      0,
      Math.round((Date.parse(parsed.end) - Date.parse(parsed.start)) / 1000),
    );

    stages.set(parsed.name, {
      name: parsed.name,
      status: parsed.exit === 0 ? "pass" : "fail",
      durationSeconds,
      start: parsed.start,
      end: parsed.end,
      exit: parsed.exit,
    });
  }

  return stages;
}

function walkSuites(suites, visitor) {
  if (!Array.isArray(suites)) {
    return;
  }

  for (const suite of suites) {
    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        if (!Array.isArray(spec.tests)) {
          continue;
        }
        for (const testCase of spec.tests) {
          visitor(testCase);
        }
      }
    }
    if (Array.isArray(suite.suites)) {
      walkSuites(suite.suites, visitor);
    }
  }
}

function parsePlaywrightReport() {
  const report = readJsonFile(PATHS.playwright, "reports/playwright.json");
  const byBrowser = {};
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  walkSuites(report.suites, (testCase) => {
    const browser = testCase.projectName ?? "unknown";
    byBrowser[browser] ??= { passed: 0, failed: 0, skipped: 0 };

    if (testCase.status === "expected") {
      passed += 1;
      byBrowser[browser].passed += 1;
      return;
    }

    if (testCase.status === "skipped") {
      skipped += 1;
      byBrowser[browser].skipped += 1;
      return;
    }

    failed += 1;
    byBrowser[browser].failed += 1;
  });

  const byBrowserCounts = Object.fromEntries(
    Object.entries(byBrowser).map(([browser, counts]) => [
      browser,
      counts.passed + counts.failed + counts.skipped,
    ]),
  );

  const total = passed + failed + skipped;
  if (total === 0) {
    throw new Error(
      "Playwright report contains no test results. Did the e2e suite run?",
    );
  }

  return {
    passed,
    failed,
    skipped,
    total,
    byBrowser: byBrowserCounts,
  };
}

function parseAxeReport() {
  const report = readJsonFile(PATHS.axe, "reports/axe.json");
  const violations = report.violations ?? report.totalViolations;
  const statesScanned = report.statesScanned ?? report.pagesScanned;

  if (typeof violations !== "number") {
    throw new Error("axe.json must include a numeric violations count.");
  }
  if (typeof statesScanned !== "number") {
    throw new Error("axe.json must include a numeric statesScanned count.");
  }

  return {
    standard: report.standard ?? "WCAG 2.2 AA",
    violations,
    statesScanned,
    details: Array.isArray(report.details) ? report.details : [],
  };
}

function findLhrFiles(dir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.name.startsWith("lhr-") && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

function scoreFromCategory(category) {
  if (!category || typeof category.score !== "number") {
    return null;
  }
  return Math.round(category.score * 100);
}

function median(values) {
  if (values.length === 0) {
    throw new Error("Cannot compute median of an empty array.");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return sorted[middle];
}

function parseLhciReport() {
  const lhrFiles = findLhrFiles(PATHS.lhci);
  if (lhrFiles.length === 0) {
    throw new Error(
      `No Lighthouse result files found under ${PATHS.lhci}. Expected lhr-*.json files.`,
    );
  }

  const performance = [];
  const accessibility = [];
  const bestPractices = [];
  const seo = [];

  for (const file of lhrFiles) {
    const lhr = readJsonFile(file, file);
    const categories = lhr.categories ?? {};
    const perf = scoreFromCategory(categories.performance);
    const a11y = scoreFromCategory(categories.accessibility);
    const bp = scoreFromCategory(categories["best-practices"]);
    const seoScore = scoreFromCategory(categories.seo);

    if ([perf, a11y, bp, seoScore].some((score) => score === null)) {
      throw new Error(
        `Lighthouse result ${file} is missing one or more category scores.`,
      );
    }

    performance.push(perf);
    accessibility.push(a11y);
    bestPractices.push(bp);
    seo.push(seoScore);
  }

  return {
    formFactor: "mobile",
    runs: lhrFiles.length,
    performance: median(performance),
    accessibility: median(accessibility),
    bestPractices: median(bestPractices),
    seo: median(seo),
  };
}

function resolveCommitMessage() {
  if (process.env.COMMIT_MESSAGE?.trim()) {
    return process.env.COMMIT_MESSAGE.trim();
  }
  if (process.env.GITHUB_EVENT_NAME === "schedule") {
    return "scheduled: weekly re-verification";
  }
  return "CI quality run";
}

function resolveBranch() {
  return process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME ?? "main";
}

function computePipelineDurationSeconds(stageMap) {
  const ordered = STAGE_ORDER.filter((name) => stageMap.has(name)).map((name) =>
    stageMap.get(name),
  );
  if (ordered.length === 0) {
    return 0;
  }

  const firstStart = Date.parse(ordered[0].start);
  const deployStage = stageMap.get("Deploy");
  const endTime = deployStage
    ? Date.parse(deployStage.start)
    : Date.parse(ordered[ordered.length - 1].end);

  return Math.max(0, Math.round((endTime - firstStart) / 1000));
}

function buildStageReport(stageMap, gateStatus) {
  return STAGE_ORDER.map((name) => {
    if (name === "Deploy") {
      return {
        name,
        status: gateStatus === "fail" ? "fail" : "pass",
        durationSeconds: null,
      };
    }

    const stage = stageMap.get(name);
    if (!stage) {
      return {
        name,
        status: "fail",
        durationSeconds: 0,
      };
    }

    return {
      name: stage.name,
      status: stage.status,
      durationSeconds: stage.durationSeconds,
    };
  });
}

function evaluateGates({
  stageMap,
  lighthouse,
  axe,
  playwright,
  pipelineSeconds,
}) {
  const failures = [];

  if (playwright.failed > 0 || playwright.skipped > 0) {
    failures.push(
      `Playwright: ${playwright.passed}/${playwright.total} passed (${playwright.failed} failed, ${playwright.skipped} skipped). Blocked.`,
    );
  }

  if (axe.violations > BUDGETS.axeMaxViolations) {
    const detail =
      axe.details.length > 0
        ? ` (${axe.details
            .map((item) => item.id ?? item.rule)
            .filter(Boolean)
            .join(", ")})`
        : "";
    failures.push(
      `axe: ${axe.violations} violation${axe.violations === 1 ? "" : "s"}${detail}. Blocked.`,
    );
  }

  const lighthouseCategories = [
    ["performance", lighthouse.performance],
    ["accessibility", lighthouse.accessibility],
    ["best practices", lighthouse.bestPractices],
    ["SEO", lighthouse.seo],
  ];

  for (const [label, score] of lighthouseCategories) {
    if (score < BUDGETS.lighthouseMin) {
      failures.push(
        `Lighthouse ${label} ${score} < ${BUDGETS.lighthouseMin}. Blocked.`,
      );
    }
  }

  for (const stageName of ["Install", "Lint", "Build"]) {
    const stage = stageMap.get(stageName);
    if (stage && stage.exit !== 0) {
      failures.push(`${stageName} stage failed. Blocked.`);
    }
  }

  if (failures.length > 0) {
    return { status: "fail", note: failures[0], failures };
  }

  if (pipelineSeconds > BUDGETS.pipelineMaxSeconds) {
    const minutes = Math.floor(pipelineSeconds / 60);
    const seconds = pipelineSeconds % 60;
    const durationLabel =
      seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
    return {
      status: "warn",
      note: `Pipeline ${durationLabel}, over the 3m budget.`,
      failures: [],
    };
  }

  return { status: "pass", note: undefined, failures: [] };
}

function writeStepSummary(report, gateResult) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  const lines = [
    "## Quality gates",
    "",
    `**Overall:** ${gateResult.status.toUpperCase()}`,
    "",
    "| Gate | Result |",
    "| --- | --- |",
    `| Playwright | ${report.latest.playwright.passed}/${report.latest.playwright.total} passed |`,
    `| axe | ${report.latest.axe.violations} violations (${report.latest.axe.statesScanned} states) |`,
    `| Lighthouse perf | ${report.latest.lighthouse.performance} |`,
    `| Lighthouse a11y | ${report.latest.lighthouse.accessibility} |`,
    `| Lighthouse best practices | ${report.latest.lighthouse.bestPractices} |`,
    `| Lighthouse SEO | ${report.latest.lighthouse.seo} |`,
    `| Pipeline | ${report.latest.durationSeconds}s (budget ${BUDGETS.pipelineMaxSeconds}s) |`,
  ];

  if (gateResult.note) {
    lines.push("", gateResult.note);
  }

  if (gateResult.failures.length > 1) {
    lines.push("", "**Additional failures:**");
    for (const failure of gateResult.failures.slice(1)) {
      lines.push(`- ${failure}`);
    }
  }

  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
}

function writeGithubOutput(gateStatus) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }
  appendFileSync(outputPath, `gate_status=${gateStatus}\n`);
}

function main() {
  const stageMap = readStages();
  const playwright = parsePlaywrightReport();
  const axe = parseAxeReport();
  const lighthouse = parseLhciReport();
  const pipelineSeconds = computePipelineDurationSeconds(stageMap);
  const gateResult = evaluateGates({
    stageMap,
    lighthouse,
    axe,
    playwright,
    pipelineSeconds,
  });

  const runNumber = Number.parseInt(process.env.GITHUB_RUN_NUMBER ?? "0", 10);
  if (!Number.isFinite(runNumber) || runNumber <= 0) {
    throw new Error("GITHUB_RUN_NUMBER is required.");
  }

  const commitSha = process.env.GITHUB_SHA;
  if (!commitSha) {
    throw new Error("GITHUB_SHA is required.");
  }

  const generatedAt = process.env.BUILD_TIME ?? new Date().toISOString();
  const history = readJsonFileOptional(PATHS.history, { runs: [] });
  const previousRuns = Array.isArray(history.runs) ? history.runs : [];

  const report = {
    generatedAt,
    actionsUrl: buildActionsUrl(),
    budgets: BUDGETS,
    latest: {
      number: runNumber,
      commit: commitSha.slice(0, 7),
      message: resolveCommitMessage(),
      branch: resolveBranch(),
      durationSeconds: pipelineSeconds,
      durationScope: "to-deploy",
      status: gateResult.status,
      ...(gateResult.note ? { note: gateResult.note } : {}),
      deployedAt: generatedAt,
      deployTarget: "Vercel",
      lighthouse,
      axe: {
        standard: axe.standard,
        violations: axe.violations,
        statesScanned: axe.statesScanned,
      },
      playwright,
      stages: buildStageReport(stageMap, gateResult.status),
    },
    runs: previousRuns.slice(0, 20),
  };

  mkdirSync(PATHS.root + "/reports", { recursive: true });
  writeFileSync(PATHS.qualityReport, `${JSON.stringify(report, null, 2)}\n`);

  writeStepSummary(report, gateResult);
  writeGithubOutput(gateResult.status);

  console.log(`Wrote ${PATHS.qualityReport}`);
  console.log(`Gate status: ${gateResult.status}`);
  if (gateResult.note) {
    console.log(gateResult.note);
  }
  console.log(`Run URL: ${buildRunUrl(runNumber) ?? "(unavailable)"}`);

  if (gateResult.status === "fail") {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`collect-report.mjs failed: ${message}`);
  process.exit(1);
}
