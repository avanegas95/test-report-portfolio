import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "astro/zod";
import sampleReport from "@/data/quality-report.sample.json";
import type { Status } from "@/lib/status";

const QualityStatus = z.enum(["pass", "warn", "fail", "info"]);

const QualityReportSchema = z.object({
  generatedAt: z.string(),
  actionsUrl: z.string().url(),
  budgets: z.object({
    lighthouseMin: z.number().int(),
    axeMaxViolations: z.number().int(),
    pipelineMaxSeconds: z.number().int(),
  }),
  latest: z.object({
    number: z.number().int(),
    commit: z.string(),
    message: z.string(),
    branch: z.string(),
    durationSeconds: z.number(),
    durationScope: z.enum(["to-deploy", "total"]).optional(),
    status: QualityStatus,
    deployedAt: z.string(),
    deployTarget: z.string(),
    lighthouse: z.object({
      formFactor: z.string().optional(),
      runs: z.number().int().optional(),
      performance: z.number().int(),
      accessibility: z.number().int(),
      bestPractices: z.number().int(),
      seo: z.number().int(),
    }),
    axe: z.object({
      standard: z.string().optional(),
      violations: z.number().int(),
      statesScanned: z.number().int(),
    }),
    playwright: z.object({
      passed: z.number().int(),
      failed: z.number().int().optional(),
      skipped: z.number().int().optional(),
      total: z.number().int(),
      byBrowser: z.record(z.string(), z.number().int()).optional(),
    }),
    stages: z.array(
      z.object({
        name: z.string(),
        status: QualityStatus,
        durationSeconds: z.number().nullable(),
      }),
    ),
  }),
  runs: z.array(
    z.object({
      number: z.number().int(),
      commit: z.string(),
      message: z.string(),
      durationSeconds: z.number(),
      status: QualityStatus,
      note: z.string().optional(),
      url: z.string().url().optional(),
    }),
  ),
});

export type QualityReport = z.infer<typeof QualityReportSchema> & {
  latest: z.infer<typeof QualityReportSchema>["latest"] & { status: Status };
  runs: Array<
    z.infer<typeof QualityReportSchema>["runs"][number] & { status: Status }
  >;
};

export interface LoadedQualityReport {
  report: QualityReport;
  isSample: boolean;
}

function loadRawQualityReport(): unknown {
  const qualityPath = process.env.QUALITY_REPORT;
  const isProduction = process.env.DEPLOY_ENV === "production";

  if (!qualityPath) {
    if (isProduction) {
      throw new Error(
        "QUALITY_REPORT is required for production builds (DEPLOY_ENV=production).",
      );
    }
    return sampleReport;
  }

  const absolutePath = resolve(qualityPath);
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

export function loadQualityReport(): LoadedQualityReport {
  const qualityPath = process.env.QUALITY_REPORT;
  const raw = loadRawQualityReport();
  const parsed = QualityReportSchema.safeParse(raw);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid quality report:\n${details}`);
  }

  return {
    report: parsed.data as QualityReport,
    isSample: !qualityPath,
  };
}
