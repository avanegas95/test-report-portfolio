import type { MetricValue, SiteValue, SuiteValue } from "@/lib/content-schemas";
import {
  formatEnvironment,
  formatGenerated,
  formatPassRate,
  formatTitleSuffix,
} from "@/lib/format";
import type { Status } from "@/lib/status";
import type { Suite } from "@/lib/types";
import {
  getBuildTime,
  getBuildYear,
  getReportId,
  getVersion,
} from "@/lib/version";

export interface CaseTotals {
  caseCount: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface ComputedMetrics extends CaseTotals {
  suiteCount: number;
  toolCount: number;
  passRate: string;
}

export interface ReportContext {
  buildTime: Date;
  version: string;
  reportId: string;
  generated: string;
  environment: string;
  totals: CaseTotals;
  suiteCount: number;
  toolCount: number;
  passRate: string;
  overallStatus: Status;
  statusLine: string;
  hero: SiteValue["hero"] & {
    titleSuffix: string;
    overallStatus: Status;
    statusLine: string;
  };
  meta: Array<{ key: string; value: string }>;
  metrics: Array<{ value: string; label: string; status?: Status }>;
  suites: Suite[];
  footerLeft: string;
  contact: SiteValue["contact"];
  site: SiteValue;
}

export function computeCaseTotals(suites: SuiteValue[]): CaseTotals {
  const allCases = suites.flatMap((suite) => suite.cases);
  const passed = allCases.filter((c) => c.status === "pass").length;
  const failed = allCases.filter((c) => c.status === "fail").length;

  return {
    caseCount: allCases.length,
    passed,
    failed,
    skipped: 0,
  };
}

export function computeOverallStatus(suites: SuiteValue[]): Status {
  const statuses = suites.flatMap((suite) => suite.cases.map((c) => c.status));
  if (statuses.some((s) => s === "fail")) return "fail";
  if (statuses.some((s) => s === "warn")) return "warn";
  return "pass";
}

export function computeToolCount(
  tools: SiteValue["tools"],
  testBeds: SiteValue["testBeds"],
): number {
  void testBeds;
  return tools.reduce((sum, group) => sum + group.items.length, 0);
}

export function computeStatusLine(totals: CaseTotals): string {
  return `${totals.passed}/${totals.caseCount} cases · 0 critical escapes · 0 open blockers`;
}

export function sortSuites(suites: SuiteValue[]): SuiteValue[] {
  return [...suites].sort((a, b) => {
    const orderDiff = (a.order ?? 999) - (b.order ?? 999);
    if (orderDiff !== 0) return orderDiff;
    return b.start.localeCompare(a.start);
  });
}

function resolveMetric(
  metric: MetricValue,
  computed: ComputedMetrics,
): { value: string; label: string; status?: Status } {
  if (metric.kind === "static") {
    return {
      value: metric.value,
      label: metric.label,
      status: metric.status,
    };
  }

  switch (metric.metric) {
    case "suiteCount":
      return {
        value: String(computed.suiteCount),
        label: metric.label,
        status: metric.status,
      };
    case "toolCount":
      return {
        value: String(computed.toolCount),
        label: metric.label,
        status: metric.status,
      };
    case "passRate":
      return {
        value: computed.passRate,
        label: metric.label,
        status: metric.status,
      };
    case "caseCount":
      return {
        value: String(computed.caseCount),
        label: metric.label,
        status: metric.status,
      };
  }
}

export function buildReportContext({
  site,
  suites,
  buildTime = getBuildTime(),
}: {
  site: SiteValue;
  suites: SuiteValue[];
  buildTime?: Date;
}): ReportContext {
  const orderedSuites = sortSuites(suites);
  const totals = computeCaseTotals(orderedSuites);
  const suiteCount = orderedSuites.length;
  const toolCount = computeToolCount(site.tools, site.testBeds);
  const passRate = formatPassRate(totals.passed, totals.caseCount);
  const version = getVersion(buildTime);
  const reportId = getReportId(buildTime);
  const generated = formatGenerated(buildTime);
  const environment = formatEnvironment(site.report.location, buildTime);
  const overallStatus = computeOverallStatus(orderedSuites);
  const statusLine = computeStatusLine(totals);
  const titleSuffix = formatTitleSuffix(site.hero.titleSuffix, version);

  const computed: ComputedMetrics = {
    ...totals,
    suiteCount,
    toolCount,
    passRate,
  };

  return {
    buildTime,
    version,
    reportId,
    generated,
    environment,
    totals,
    suiteCount,
    toolCount,
    passRate,
    overallStatus,
    statusLine,
    hero: {
      ...site.hero,
      titleSuffix,
      overallStatus,
      statusLine,
    },
    meta: [
      { key: "REPORT ID", value: reportId },
      { key: "GENERATED", value: generated },
      { key: "SUBJECT", value: site.report.subject },
      { key: "ENVIRONMENT", value: environment },
    ],
    metrics: site.metrics.map((metric) => resolveMetric(metric, computed)),
    suites: orderedSuites as Suite[],
    footerLeft: site.footer.left.replace(
      "{year}",
      String(getBuildYear(buildTime)),
    ),
    contact: site.contact,
    site,
  };
}
