import { readFileSync, existsSync } from "node:fs";

export function readJsonFile(path, label = path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${label}`);
  }

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${label}: ${message}`);
  }
}

export function readJsonFileOptional(path, fallback) {
  if (!existsSync(path)) {
    return fallback;
  }
  return readJsonFile(path, path);
}
