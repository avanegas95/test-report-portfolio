#!/usr/bin/env node
/**
 * Compare Build A (dist/) with Build B (.vercel/output/static/).
 * HTML files are compared after removing the § 04 [data-quality-region] subtree.
 * All other files must hash-match byte for byte.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseHtml } from "node-html-parser";
import { PATHS } from "./lib/paths.mjs";

function listFiles(rootDir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      files.push(relative(rootDir, fullPath));
    }
  }

  if (!existsSync(rootDir)) {
    throw new Error(`Build output directory not found: ${rootDir}`);
  }

  walk(rootDir);
  return files.sort();
}

function hashFile(path) {
  const buffer = readFileSync(path);
  return createHash("sha256").update(buffer).digest("hex");
}

function stripQualityRegion(html) {
  const root = parseHtml(html, {
    lowerCaseTagName: false,
    comment: false,
  });

  const qualityRegion =
    root.querySelector("[data-quality-region]") ??
    root.querySelector("section#quality");
  qualityRegion?.remove();

  return root.toString();
}

function normalizeHtml(relativePath, contents) {
  const stripped = stripQualityRegion(contents);
  return stripped.replace(/\s+/g, " ").trim();
}

function compareBuilds(buildA, buildB) {
  const filesA = listFiles(buildA);
  const filesB = listFiles(buildB);
  const setA = new Set(filesA);
  const setB = new Set(filesB);
  const mismatches = [];

  for (const file of filesA) {
    if (!setB.has(file)) {
      mismatches.push({ file, reason: "missing from Build B" });
    }
  }

  for (const file of filesB) {
    if (!setA.has(file)) {
      mismatches.push({ file, reason: "missing from Build A" });
    }
  }

  for (const file of filesA) {
    if (!setB.has(file)) {
      continue;
    }

    const pathA = join(buildA, file);
    const pathB = join(buildB, file);
    const statA = statSync(pathA);
    const statB = statSync(pathB);

    if (!statA.isFile() || !statB.isFile()) {
      continue;
    }

    if (file.endsWith(".html")) {
      const htmlA = readFileSync(pathA, "utf8");
      const htmlB = readFileSync(pathB, "utf8");
      const normalizedA = normalizeHtml(file, htmlA);
      const normalizedB = normalizeHtml(file, htmlB);

      if (normalizedA !== normalizedB) {
        mismatches.push({
          file,
          reason: "HTML differs outside § 04 (data-quality-region stripped)",
        });
      }
      continue;
    }

    const hashA = hashFile(pathA);
    const hashB = hashFile(pathB);
    if (hashA !== hashB) {
      mismatches.push({ file, reason: "hash mismatch" });
    }
  }

  return mismatches;
}

function main() {
  console.log(
    `Comparing Build A (${PATHS.buildA}) with Build B (${PATHS.buildB})...`,
  );
  const mismatches = compareBuilds(PATHS.buildA, PATHS.buildB);

  if (mismatches.length === 0) {
    console.log("Build A and Build B are equivalent outside § 04.");
    return;
  }

  console.error("Build equivalence check failed:");
  for (const mismatch of mismatches) {
    console.error(`- ${mismatch.file}: ${mismatch.reason}`);
  }
  process.exit(1);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`equivalence.mjs failed: ${message}`);
  process.exit(1);
}
