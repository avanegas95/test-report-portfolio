export type Status = "pass" | "warn" | "fail" | "info" | "neutral";

export function scoreRingStatus(score: number): Status {
  if (score >= 95) return "pass";
  if (score >= 50) return "warn";
  return "fail";
}

export function statusLabel(status: Status): string {
  switch (status) {
    case "pass":
      return "PASS";
    case "warn":
      return "WARN";
    case "fail":
      return "FAIL";
    case "info":
      return "INFO";
    default:
      return "NEUTRAL";
  }
}

export function statusBgClass(status: Status): string {
  switch (status) {
    case "pass":
      return "bg-pass-bg text-pass";
    case "warn":
      return "bg-warn-bg text-warn";
    case "fail":
      return "bg-fail-bg text-fail";
    case "info":
      return "bg-info-bg text-info";
    default:
      return "bg-chip-neutral text-neutral";
  }
}

export function statusDotClass(status: Status): string {
  switch (status) {
    case "pass":
      return "bg-pass-dot";
    case "warn":
      return "bg-warn-dot";
    case "fail":
      return "bg-fail-dot";
    case "info":
      return "bg-info-dot";
    default:
      return "bg-muted";
  }
}

export function statusRingStrokeClass(status: Status): string {
  switch (status) {
    case "pass":
      return "stroke-pass-dot";
    case "warn":
      return "stroke-warn-dot";
    case "fail":
      return "stroke-fail-dot";
    default:
      return "stroke-muted";
  }
}

export function statusRingTrackClass(status: Status): string {
  switch (status) {
    case "pass":
      return "stroke-pass-bg";
    case "warn":
      return "stroke-warn-bg";
    case "fail":
      return "stroke-fail-bg";
    default:
      return "stroke-rule";
  }
}

export function statusTextClass(status: Status): string {
  switch (status) {
    case "pass":
      return "text-pass";
    case "warn":
      return "text-warn";
    case "fail":
      return "text-fail";
    case "info":
      return "text-info";
    default:
      return "text-neutral";
  }
}

export function terminalResultClass(status: Status): string {
  return statusTextClass(status);
}
