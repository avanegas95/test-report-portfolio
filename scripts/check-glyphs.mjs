#!/usr/bin/env node
/**
 * Fails if content JSON contains characters outside the @fontsource latin subset.
 * Arrows (→), terminal cursor (▍), and checkmarks (✓) must be rendered as SVG/CSS.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const UNICODE_RANGE = readFileSync(
  join(root, "node_modules/@fontsource/ibm-plex-sans/unicode.json"),
  "utf8",
);
const { latin: latinRange } = JSON.parse(UNICODE_RANGE);

/** @type {Array<[number, number]>} */
const ranges = latinRange.split(",").map((part) => {
  const trimmed = part.trim().replace(/^U\+/i, "");
  const [startHex, endHex] = trimmed.split("-");
  const start = Number.parseInt(startHex, 16);
  const end = Number.parseInt(endHex ?? startHex, 16);
  return [start, end];
});

/** @param {number} codePoint */
function isAllowed(codePoint) {
  return ranges.some(([start, end]) => codePoint >= start && codePoint <= end);
}

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

/** @param {unknown} value @param {string} path @param {string} file */
function walk(value, path, file, violations) {
  if (typeof value === "string") {
    for (const char of value) {
      const codePoint = char.codePointAt(0);
      if (codePoint === undefined) continue;
      if (!isAllowed(codePoint)) {
        violations.push({
          file,
          path,
          char,
          codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
        });
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walk(item, `${path}[${index}]`, file, violations),
    );
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      walk(nested, path ? `${path}.${key}` : key, file, violations);
    }
  }
}

const contentDir = join(root, "src/content");
const files = collectJsonFiles(contentDir);

if (files.length === 0) {
  console.log("check-glyphs: no src/content JSON yet — skipped.");
  process.exit(0);
}

/** @type {Array<{ file: string, path: string, char: string, codePoint: string }>} */
const violations = [];

for (const file of files) {
  const json = JSON.parse(readFileSync(file, "utf8"));
  walk(json, "", relative(root, file), violations);
}

if (violations.length > 0) {
  console.error("check-glyphs: characters outside the latin subset found:\n");
  for (const { file, path, char, codePoint } of violations) {
    console.error(
      `  ${file}${path ? ` → ${path}` : ""}: "${char}" (${codePoint})`,
    );
  }
  console.error(
    "\nRender →, ✓, and ▍ as inline SVG/CSS — do not rely on font glyphs.",
  );
  process.exit(1);
}

console.log(`check-glyphs: ${files.length} file(s) OK.`);
