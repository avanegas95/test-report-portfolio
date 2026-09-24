#!/usr/bin/env node
/**
 * Update history.json on the quality-history branch.
 * PR runs are skipped by the workflow; this script assumes a non-PR context.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PATHS } from "./lib/paths.mjs";
import { readJsonFile, readJsonFileOptional } from "./lib/read-json.mjs";

const HISTORY_BRANCH = "quality-history";
const MAX_RUNS = 20;
const MAX_REBASE_ATTEMPTS = 3;

function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: "inherit",
    ...options,
  });
}

function runCapture(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
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
    return new Map();
  }

  const stages = new Map();
  for (const line of readFileSync(PATHS.stages, "utf8")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)) {
    const parsed = JSON.parse(line);
    stages.set(parsed.name, parsed);
  }
  return stages;
}

function computeTotalDurationSeconds(stageMap) {
  const install = stageMap.get("Install");
  const deploy = stageMap.get("Deploy");
  if (!install?.start) {
    return 0;
  }

  const end = deploy?.end ?? install.end;
  return Math.max(
    0,
    Math.round((Date.parse(end) - Date.parse(install.start)) / 1000),
  );
}

function computeToDeployDurationSeconds(stageMap) {
  const install = stageMap.get("Install");
  const deploy = stageMap.get("Deploy");
  if (!install?.start) {
    return 0;
  }

  const end = deploy?.start ?? install.end;
  return Math.max(
    0,
    Math.round((Date.parse(end) - Date.parse(install.start)) / 1000),
  );
}

function buildRunSummary(report, stageMap) {
  const existingNote = readJsonFileOptional(PATHS.history, {
    runs: [],
  }).runs?.find((run) => run.number === report.latest.number)?.note;

  const summary = {
    number: report.latest.number,
    commit: report.latest.commit,
    message: report.latest.message,
    durationSeconds: computeTotalDurationSeconds(stageMap),
    status: report.latest.status,
    url: buildRunUrl(report.latest.number),
  };

  const note =
    existingNote ?? report.latest.note ?? deriveNoteFromReport(report);
  if (note) {
    summary.note = note;
  }

  return summary;
}

function deriveNoteFromReport(report) {
  if (report.latest.status === "warn") {
    const seconds = report.latest.durationSeconds;
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    const durationLabel =
      remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
    return `Pipeline ${durationLabel}, over the 3m budget.`;
  }

  if (report.latest.status === "fail") {
    const deployStage = report.latest.stages.find(
      (stage) => stage.name === "Deploy",
    );
    if (deployStage?.status === "fail") {
      return "Quality gates failed. Blocked.";
    }
  }

  return undefined;
}

function upsertRun(runs, summary) {
  const withoutCurrent = runs.filter((run) => run.number !== summary.number);
  return [summary, ...withoutCurrent].slice(0, MAX_RUNS);
}

function finalizeDeployedReport(report, stageMap) {
  const deployed = structuredClone(report);
  const deployStage = stageMap.get("Deploy");

  deployed.latest.durationSeconds = computeToDeployDurationSeconds(stageMap);
  deployed.latest.durationScope = "to-deploy";

  deployed.latest.stages = deployed.latest.stages.map((stage) => {
    if (stage.name !== "Deploy") {
      return stage;
    }

    if (!deployStage) {
      return stage;
    }

    return {
      name: "Deploy",
      status: deployStage.exit === 0 ? "pass" : "fail",
      durationSeconds: null,
    };
  });

  return deployed;
}

function writeHistoryFile(history) {
  mkdirSync(PATHS.root + "/.quality", { recursive: true });
  const historyPath = PATHS.root + "/.quality/history.next.json";
  writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
  return historyPath;
}

function branchExists(branch) {
  try {
    runCapture("git", ["show-ref", "--verify", `refs/heads/${branch}`]);
    return true;
  } catch {
    return false;
  }
}

function remoteBranchExists(branch) {
  try {
    runCapture("git", [
      "show-ref",
      "--verify",
      `refs/remotes/origin/${branch}`,
    ]);
    return true;
  } catch {
    return false;
  }
}

function checkoutHistoryBranch() {
  try {
    run("git", ["fetch", "origin", HISTORY_BRANCH], { stdio: "pipe" });
  } catch {
    // First run: the history branch does not exist on the remote yet.
  }

  if (remoteBranchExists(HISTORY_BRANCH)) {
    run("git", ["checkout", HISTORY_BRANCH]);
    run("git", ["reset", "--hard", `origin/${HISTORY_BRANCH}`]);
    return;
  }

  if (branchExists(HISTORY_BRANCH)) {
    run("git", ["checkout", HISTORY_BRANCH]);
    return;
  }

  run("git", ["checkout", "--orphan", HISTORY_BRANCH]);
  try {
    run("git", ["rm", "-rf", "."], { stdio: "pipe" });
  } catch {
    // First orphan checkout may have nothing to remove.
  }
}

function pushWithRetry() {
  for (let attempt = 1; attempt <= MAX_REBASE_ATTEMPTS; attempt += 1) {
    try {
      run("git", ["push", "origin", HISTORY_BRANCH]);
      return;
    } catch (error) {
      if (attempt === MAX_REBASE_ATTEMPTS) {
        throw error;
      }

      console.warn(
        `Push to ${HISTORY_BRANCH} failed (attempt ${attempt}/${MAX_REBASE_ATTEMPTS}). Rebasing and retrying...`,
      );
      run("git", ["fetch", "origin", HISTORY_BRANCH]);
      run("git", ["rebase", `origin/${HISTORY_BRANCH}`]);
    }
  }
}

function main() {
  if (process.env.GITHUB_EVENT_NAME === "pull_request") {
    console.log("Skipping history recording for pull_request events.");
    return;
  }

  const report = readJsonFile(
    PATHS.qualityReport,
    "reports/quality-report.json",
  );
  const stageMap = readStages();
  const existingHistory = readJsonFileOptional(PATHS.history, { runs: [] });
  const runs = Array.isArray(existingHistory.runs) ? existingHistory.runs : [];
  const runSummary = buildRunSummary(report, stageMap);

  const history = {
    runs: upsertRun(runs, runSummary),
    deployed: existingHistory.deployed ?? null,
  };

  if (report.latest.status !== "fail") {
    history.deployed = finalizeDeployedReport(report, stageMap);
  } else if (!history.deployed) {
    history.deployed = null;
  }

  const originalBranch = runCapture("git", [
    "rev-parse",
    "--abbrev-ref",
    "HEAD",
  ]);
  const historyPath = writeHistoryFile(history);

  checkoutHistoryBranch();
  writeFileSync("history.json", readFileSync(historyPath, "utf8"));
  run("git", ["add", "history.json"]);

  try {
    run("git", [
      "commit",
      "-m",
      `history: record run #${report.latest.number}`,
    ]);
  } catch {
    if (runCapture("git", ["status", "--porcelain"]) === "") {
      console.log("No history changes to commit.");
      run("git", ["checkout", originalBranch]);
      return;
    }
    throw new Error("Failed to commit history.json.");
  }

  pushWithRetry();
  run("git", ["checkout", originalBranch]);

  console.log(
    `Recorded run #${report.latest.number} on ${HISTORY_BRANCH} (status: ${report.latest.status}).`,
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`record-history.mjs failed: ${message}`);
  process.exit(1);
}
