export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (remainder === 0) return `${minutes}m`;
  return `${minutes}m ${remainder}s`;
}

export function formatSuiteDates(start: string, end: string | null): string {
  if (end === null) return `${start} — present`;
  return `${start} — ${end}`;
}

export function formatPassRate(passed: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((passed / total) * 100)}%`;
}

export function formatSuitePassLabel(passed: number, total: number): string {
  return `${passed}/${total} passed`;
}

export function formatDeployTime(iso: string): { time: string; zone: string } {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  });
  const zone =
    date
      .toLocaleTimeString("en-US", {
        timeZoneName: "short",
        timeZone: "America/New_York",
      })
      .split(" ")
      .pop() ?? "EDT";
  return { time, zone };
}

export function formatDeployDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

export function formatReportUpdated(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  });
  const zone =
    date
      .toLocaleTimeString("en-US", {
        timeZoneName: "short",
        timeZone: "America/New_York",
      })
      .split(" ")
      .pop() ?? "EDT";
  return `${datePart} ${timePart} ${zone}`;
}
