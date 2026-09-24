#!/usr/bin/env node
/**
 * Validate reports/quality-report.json against the JSON Schema.
 */
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { PATHS } from "./lib/paths.mjs";
import { readJsonFile } from "./lib/read-json.mjs";

function main() {
  const report = readJsonFile(
    PATHS.qualityReport,
    "reports/quality-report.json",
  );
  const schema = JSON.parse(readFileSync(PATHS.schema, "utf8"));

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(report);

  if (valid) {
    console.log(
      `Validated ${PATHS.qualityReport} against quality-report.schema.json.`,
    );
    return;
  }

  console.error("Quality report failed schema validation:");
  for (const error of validate.errors ?? []) {
    const path = error.instancePath || "(root)";
    console.error(`- ${path}: ${error.message}`);
  }
  process.exit(1);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`validate-report.mjs failed: ${message}`);
  process.exit(1);
}
