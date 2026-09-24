#!/usr/bin/env node
/**
 * Launch guard for src/content JSON.
 * Warns by default; fails when STRICT_CONTENT=1.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const contentDir = join(root, "src/content");
const strict = process.env.STRICT_CONTENT === "1";

const FLAG_PATTERNS = [
  { label: "PLACEHOLDER", test: (value) => value.includes("PLACEHOLDER") },
  { label: "[ADD IMPACT", test: (value) => value.includes("[ADD IMPACT") },
  { label: "[YOUR EMAIL]", test: (value) => value.includes("[YOUR EMAIL]") },
  { label: "COMPUTED:", test: (value) => value.includes("COMPUTED:") },
];

/** @param {string} dir */
function collectJsonFiles(dir) {
  /** @type {string[]} */
  const files = [];

  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    return files;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files;
}

/** @param {unknown} value @param {string} path @param {string} file @param {Array<{ file: string, path: string, message: string }>} findings */
function walk(value, path, file, findings) {
  if (typeof value === "string") {
    for (const { label, test } of FLAG_PATTERNS) {
      if (test(value)) {
        findings.push({
          file,
          path,
          message: `contains ${label}`,
        });
      }
    }
    return;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = /** @type {Record<string, unknown>} */ (value);
    if (record.draft === true && path.endsWith(".story")) {
      findings.push({
        file,
        path,
        message: "story has draft: true",
      });
    }
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walk(item, `${path}[${index}]`, file, findings),
    );
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      const nextPath = path ? `${path}.${key}` : key;
      walk(nested, nextPath, file, findings);
    }
  }
}

const files = collectJsonFiles(contentDir);

if (files.length === 0) {
  console.log("check-content: no src/content JSON yet — skipped.");
  process.exit(0);
}

/** @type {Array<{ file: string, path: string, message: string }>} */
const findings = [];

for (const file of files) {
  const json = JSON.parse(readFileSync(file, "utf8"));
  walk(json, "", relative(root, file), findings);
}

if (findings.length === 0) {
  console.log(`check-content: ${files.length} file(s) OK.`);
  process.exit(0);
}

const header = strict
  ? "check-content: blocking issues found:"
  : "check-content: warnings (set STRICT_CONTENT=1 to fail):";

console.warn(`${header}\n`);
for (const { file, path, message } of findings) {
  console.warn(`  ${file}${path ? ` → ${path}` : ""}: ${message}`);
}

if (strict) {
  process.exit(1);
}

console.warn(`\ncheck-content: ${findings.length} warning(s).`);
process.exit(0);
