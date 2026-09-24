const TZ = "America/New_York";

export function getBuildDate(): Date {
  const raw = process.env.BUILD_TIME;
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export function getBuildTime(): Date {
  return getBuildDate();
}

export function getBuildYear(buildDate: Date = getBuildDate()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
  }).formatToParts(buildDate);

  return Number(
    parts.find((part) => part.type === "year")?.value ??
      new Date().getFullYear(),
  );
}

export function getVersion(buildDate: Date = getBuildDate()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
  }).formatToParts(buildDate);

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "1";

  return `v${year}.${month}`;
}

export function getReportId(buildDate: Date = getBuildDate()): string {
  return `AV-${getVersion(buildDate).slice(1)}`;
}
