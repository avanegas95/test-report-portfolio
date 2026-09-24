#!/usr/bin/env node
/**
 * Fail fast when a production build is requested without QUALITY_REPORT.
 */
if (process.env.DEPLOY_ENV === "production" && !process.env.QUALITY_REPORT) {
  console.error(
    "QUALITY_REPORT is required for production builds (DEPLOY_ENV=production).",
  );
  process.exit(1);
}
